using rebalancer.API.Controllers;
using rebalancer.Domain;

namespace rebalancer.API.Services;

/// <summary>
/// Compares actual holdings against a target model. Pure calculation — callers load the data.
/// </summary>
public static class CompareService
{
    // Buy/sell recommendations are only generated when the difference exceeds this amount
    public const decimal RecommendationThreshold = 10m;

    public static CompareResultDto Compare(Model model, IReadOnlyCollection<Holding> holdings, IReadOnlyCollection<AssetCategory> allCategories)
    {
        var totalValue = holdings.Sum(h => h.Value);

        if (totalValue == 0)
        {
            return new CompareResultDto
            {
                ModelName = model.Name,
                TotalValue = 0,
                Comparisons = new List<CategoryComparisonDto>(),
                UnmappedHoldings = holdings.Select(h => new UnmappedHoldingDto
                {
                    HoldingId = h.Id,
                    Ticker = h.Security?.Ticker ?? "Unknown",
                    SecurityName = h.Security?.Name ?? "Unknown",
                    Value = h.Value
                }).ToList()
            };
        }

        // Build a lookup of category by id
        var categoryById = allCategories.ToDictionary(c => c.Id);

        // Build a lookup of child category ids by parent id
        var childIdsByParentId = allCategories
            .Where(c => c.ParentId.HasValue)
            .ToLookup(c => c.ParentId!.Value, c => c.Id);

        // Build a lookup of allocations by category id
        var allocationByCategoryId = model.Allocations.ToDictionary(a => a.AssetCategoryId, a => a.TargetPercentage);

        // Calculate effective percentage for a category by walking up the parent chain
        decimal GetEffectivePercentage(int categoryId)
        {
            if (!allocationByCategoryId.TryGetValue(categoryId, out var percentage))
                return 0;

            decimal effective = percentage;
            var current = categoryById.GetValueOrDefault(categoryId);

            while (current?.ParentId != null)
            {
                var parentId = current.ParentId.Value;
                if (allocationByCategoryId.TryGetValue(parentId, out var parentPercentage))
                {
                    effective = (effective * parentPercentage) / 100;
                }
                current = categoryById.GetValueOrDefault(parentId);
            }

            return effective;
        }

        // Build a lookup of category descendants (including self)
        HashSet<int> GetCategoryAndDescendants(int categoryId)
        {
            var result = new HashSet<int> { categoryId };
            foreach (var childId in childIdsByParentId[categoryId])
            {
                result.UnionWith(GetCategoryAndDescendants(childId));
            }
            return result;
        }

        // Recursively resolve a security's value into category contributions.
        // Composite securities (those with Compositions) split proportionally across components.
        // Returns the total value successfully attributed to any category.
        decimal ResolveSecurityToCategories(Security security, decimal value, Dictionary<int, decimal> result, HashSet<int> visited)
        {
            if (visited.Contains(security.Id)) return 0;
            visited.Add(security.Id);

            if (security.Compositions.Any())
            {
                decimal resolved = 0;
                foreach (var comp in security.Compositions)
                {
                    if (comp.ComponentSecurity != null)
                    {
                        var portion = value * (comp.Percentage / 100m);
                        resolved += ResolveSecurityToCategories(comp.ComponentSecurity, portion, result, new HashSet<int>(visited));
                    }
                }
                return resolved;
            }

            if (security.AssetCategoryId.HasValue)
            {
                result.TryGetValue(security.AssetCategoryId.Value, out var existing);
                result[security.AssetCategoryId.Value] = existing + value;
                return value;
            }

            return 0;
        }

        // Resolve the value from a security that lands in a specific set of category IDs.
        decimal ResolveSecurityToCategorySet(Security security, decimal value, ISet<int> targetCategories, HashSet<int> visited)
        {
            if (visited.Contains(security.Id)) return 0;
            visited.Add(security.Id);

            if (security.Compositions.Any())
            {
                decimal total = 0;
                foreach (var comp in security.Compositions)
                {
                    if (comp.ComponentSecurity != null)
                    {
                        var portion = value * (comp.Percentage / 100m);
                        total += ResolveSecurityToCategorySet(comp.ComponentSecurity, portion, targetCategories, new HashSet<int>(visited));
                    }
                }
                return total;
            }

            return security.AssetCategoryId.HasValue && targetCategories.Contains(security.AssetCategoryId.Value)
                ? value
                : 0;
        }

        // Group holdings by category, expanding composite securities into proportional contributions
        var holdingsByCategory = new Dictionary<int, decimal>();
        var mappedHoldingIds = new HashSet<int>();
        foreach (var holding in holdings)
        {
            if (holding.Security == null) continue;
            var resolved = ResolveSecurityToCategories(holding.Security, holding.Value, holdingsByCategory, new HashSet<int>());
            if (resolved > 0) mappedHoldingIds.Add(holding.Id);
        }

        // Track which categories are covered by model allocations
        var coveredCategoryIds = new HashSet<int>();

        // Determine which allocations are "leaf" allocations
        var categoriesWithAllocations = new HashSet<int>(allocationByCategoryId.Keys);
        bool IsLeafAllocation(int categoryId)
        {
            var descendants = GetCategoryAndDescendants(categoryId);
            descendants.Remove(categoryId);
            return !descendants.Any(d => categoriesWithAllocations.Contains(d));
        }

        // Get depth for display ordering
        int GetDepth(int catId)
        {
            int depth = 0;
            var cat = categoryById.GetValueOrDefault(catId);
            while (cat?.ParentId != null)
            {
                depth++;
                cat = categoryById.GetValueOrDefault(cat.ParentId.Value);
            }
            return depth;
        }

        // Sort a flat list into depth-first tree order (parent immediately followed by its children)
        List<T> SortDepthFirst<T>(List<T> items, Func<T, int> getCategoryId, Func<T, string> getName)
        {
            var result = new List<T>();
            var roots = items
                .Where(c => {
                    var parentId = categoryById.GetValueOrDefault(getCategoryId(c))?.ParentId;
                    return parentId == null || !items.Any(p => getCategoryId(p) == parentId);
                })
                .OrderBy(getName)
                .ToList();

            void AddWithChildren(T item)
            {
                result.Add(item);
                var catId = getCategoryId(item);
                foreach (var child in items
                    .Where(c => categoryById.GetValueOrDefault(getCategoryId(c))?.ParentId == catId)
                    .OrderBy(getName))
                {
                    AddWithChildren(child);
                }
            }

            foreach (var root in roots)
                AddWithChildren(root);

            return result;
        }

        var comparisons = new List<CategoryComparisonDto>();
        foreach (var allocation in model.Allocations)
        {
            var categoryIds = GetCategoryAndDescendants(allocation.AssetCategoryId);
            coveredCategoryIds.UnionWith(categoryIds);

            var actualValue = categoryIds
                .Where(catId => holdingsByCategory.ContainsKey(catId))
                .Sum(catId => holdingsByCategory[catId]);

            var actualPercentage = (actualValue / totalValue) * 100;
            var effectiveTargetPercentage = GetEffectivePercentage(allocation.AssetCategoryId);
            var differencePercentage = actualPercentage - effectiveTargetPercentage;
            var targetValue = (effectiveTargetPercentage / 100) * totalValue;
            var differenceValue = actualValue - targetValue;

            string recommendation;
            var isLeaf = IsLeafAllocation(allocation.AssetCategoryId);

            if (!isLeaf)
            {
                if (Math.Abs(differencePercentage) < 0.5m)
                    recommendation = "On target";
                else if (differenceValue > 0)
                    recommendation = $"Over by ${Math.Abs(differenceValue):N0}";
                else
                    recommendation = $"Under by ${Math.Abs(differenceValue):N0}";
            }
            else
            {
                if (differenceValue > RecommendationThreshold)
                    recommendation = $"Sell ${Math.Abs(differenceValue):N0}";
                else if (differenceValue < -RecommendationThreshold)
                    recommendation = $"Buy ${Math.Abs(differenceValue):N0}";
                else
                    recommendation = "On target";
            }

            comparisons.Add(new CategoryComparisonDto
            {
                CategoryId = allocation.AssetCategoryId,
                CategoryName = allocation.AssetCategory?.Name ?? "Unknown",
                TargetPercentage = effectiveTargetPercentage,
                ActualPercentage = Math.Round(actualPercentage, 2),
                DifferencePercentage = Math.Round(differencePercentage, 2),
                DifferenceValue = Math.Round(differenceValue, 2),
                Recommendation = recommendation,
                ParentId = categoryById.GetValueOrDefault(allocation.AssetCategoryId)?.ParentId,
                Depth = GetDepth(allocation.AssetCategoryId),
                IsLeaf = isLeaf
            });
        }

        comparisons = SortDepthFirst(comparisons, c => c.CategoryId, c => c.CategoryName);

        // Unmapped = resolved to no categories, OR all resolved categories are outside the model
        var unmappedHoldings = holdings
            .Where(h => {
                if (h.Security == null) return true;
                if (!mappedHoldingIds.Contains(h.Id)) return true;
                // Composite: check if any contribution lands in a covered category
                if (h.Security.Compositions.Any())
                    return ResolveSecurityToCategorySet(h.Security, h.Value, coveredCategoryIds, new HashSet<int>()) == 0;
                return !h.Security.AssetCategoryId.HasValue || !coveredCategoryIds.Contains(h.Security.AssetCategoryId.Value);
            })
            .Select(h => new UnmappedHoldingDto
            {
                HoldingId = h.Id,
                Ticker = h.Security?.Ticker ?? "Unknown",
                SecurityName = h.Security?.Name ?? "Unknown",
                Value = h.Value
            }).ToList();

        // === Per-Account Breakdowns ===
        var accountBreakdowns = new List<AccountBreakdownDto>();
        var holdingsByAccount = holdings.GroupBy(h => h.AccountId);

        foreach (var accountGroup in holdingsByAccount)
        {
            var accountHoldings = accountGroup.ToList();
            var account = accountHoldings.First().Account;
            var accountValue = accountHoldings.Sum(h => h.Value);

            if (accountValue == 0) continue;

            var accountCategoryComparisons = new List<AccountCategoryComparisonDto>();
            var holdingRecommendations = new List<HoldingRecommendationDto>();

            // For each allocation in the model, calculate this account's target vs actual
            foreach (var allocation in model.Allocations)
            {
                var effectiveTargetPercentage = GetEffectivePercentage(allocation.AssetCategoryId);
                var targetValue = (effectiveTargetPercentage / 100) * accountValue;

                var categoryIds = GetCategoryAndDescendants(allocation.AssetCategoryId);
                var actualValue = accountHoldings
                    .Where(h => h.Security != null)
                    .Sum(h => ResolveSecurityToCategorySet(h.Security!, h.Value, categoryIds, new HashSet<int>()));
                var actualPercentage = (actualValue / accountValue) * 100;
                var differenceValue = actualValue - targetValue;

                var isLeaf = IsLeafAllocation(allocation.AssetCategoryId);

                accountCategoryComparisons.Add(new AccountCategoryComparisonDto
                {
                    CategoryId = allocation.AssetCategoryId,
                    CategoryName = allocation.AssetCategory?.Name ?? "Unknown",
                    TargetPercentage = effectiveTargetPercentage,
                    ActualPercentage = Math.Round(actualPercentage, 2),
                    TargetValue = Math.Round(targetValue, 2),
                    ActualValue = Math.Round(actualValue, 2),
                    DifferenceValue = Math.Round(differenceValue, 2),
                    Depth = GetDepth(allocation.AssetCategoryId),
                    IsLeaf = isLeaf
                });
            }

            accountCategoryComparisons = SortDepthFirst(accountCategoryComparisons, c => c.CategoryId, c => c.CategoryName);

            // Generate holding-level recommendations
            var leafComparisons = accountCategoryComparisons.Where(c => c.IsLeaf).ToList();

            foreach (var leafComp in leafComparisons)
            {
                var categoryIds = GetCategoryAndDescendants(leafComp.CategoryId);
                // Simple (non-composite) holdings that directly map to this category
                var categoryHoldings = accountHoldings
                    .Where(h => h.Security != null
                        && !h.Security.Compositions.Any()
                        && h.Security.AssetCategoryId.HasValue
                        && categoryIds.Contains(h.Security.AssetCategoryId.Value))
                    .ToList();

                // Composite holdings that contribute to this category (shown as Hold, no share-level recommendation)
                var compositeHoldings = accountHoldings
                    .Where(h => h.Security?.Compositions.Any() == true
                        && ResolveSecurityToCategorySet(h.Security!, h.Value, categoryIds, new HashSet<int>()) > 0)
                    .ToList();
                foreach (var holding in compositeHoldings)
                {
                    var contribution = ResolveSecurityToCategorySet(holding.Security!, holding.Value, categoryIds, new HashSet<int>());
                    holdingRecommendations.Add(new HoldingRecommendationDto
                    {
                        HoldingId = holding.Id,
                        Ticker = holding.Security!.Ticker,
                        SecurityName = holding.Security.Name,
                        CategoryId = leafComp.CategoryId,
                        CategoryName = leafComp.CategoryName,
                        CurrentValue = Math.Round(contribution, 2),
                        SuggestedChange = 0,
                        Recommendation = "Hold (composite)"
                    });
                }

                if (categoryHoldings.Count == 0)
                {
                    if (leafComp.DifferenceValue < -RecommendationThreshold)
                    {
                        holdingRecommendations.Add(new HoldingRecommendationDto
                        {
                            HoldingId = 0,
                            Ticker = $"[New {leafComp.CategoryName}]",
                            SecurityName = $"[New {leafComp.CategoryName} position]",
                            CategoryId = leafComp.CategoryId,
                            CategoryName = leafComp.CategoryName,
                            CurrentValue = 0,
                            SuggestedChange = Math.Round(Math.Abs(leafComp.DifferenceValue), 2),
                            Recommendation = $"Buy ${Math.Abs(leafComp.DifferenceValue):N0} in {leafComp.CategoryName}"
                        });
                    }
                }
                else if (Math.Abs(leafComp.DifferenceValue) > RecommendationThreshold)
                {
                    var totalCategoryValue = categoryHoldings.Sum(h => h.Value);

                    foreach (var holding in categoryHoldings)
                    {
                        decimal suggestedChange;
                        if (totalCategoryValue > 0)
                        {
                            var proportion = holding.Value / totalCategoryValue;
                            suggestedChange = leafComp.DifferenceValue * proportion * -1;
                        }
                        else
                        {
                            suggestedChange = leafComp.DifferenceValue * -1 / categoryHoldings.Count;
                        }

                        string recommendation;
                        if (suggestedChange > RecommendationThreshold)
                            recommendation = $"Buy ${Math.Abs(suggestedChange):N0}";
                        else if (suggestedChange < -RecommendationThreshold)
                            recommendation = $"Sell ${Math.Abs(suggestedChange):N0}";
                        else
                            recommendation = "Hold";

                        holdingRecommendations.Add(new HoldingRecommendationDto
                        {
                            HoldingId = holding.Id,
                            Ticker = holding.Security?.Ticker ?? "Unknown",
                            SecurityName = holding.Security?.Name ?? "Unknown",
                            CategoryId = holding.Security?.AssetCategoryId,
                            CategoryName = holding.Security?.AssetCategory?.Name,
                            CurrentValue = holding.Value,
                            SuggestedChange = Math.Round(suggestedChange, 2),
                            Recommendation = recommendation
                        });
                    }
                }
                else
                {
                    foreach (var holding in categoryHoldings)
                    {
                        holdingRecommendations.Add(new HoldingRecommendationDto
                        {
                            HoldingId = holding.Id,
                            Ticker = holding.Security?.Ticker ?? "Unknown",
                            SecurityName = holding.Security?.Name ?? "Unknown",
                            CategoryId = holding.Security?.AssetCategoryId,
                            CategoryName = holding.Security?.AssetCategory?.Name,
                            CurrentValue = holding.Value,
                            SuggestedChange = 0,
                            Recommendation = "Hold"
                        });
                    }
                }
            }

            // Add unmapped holdings in this account
            var unmappedInAccount = accountHoldings
                .Where(h => {
                    if (h.Security == null) return true;
                    if (h.Security.Compositions.Any())
                        return ResolveSecurityToCategorySet(h.Security, h.Value, coveredCategoryIds, new HashSet<int>()) == 0;
                    return !h.Security.AssetCategoryId.HasValue || !coveredCategoryIds.Contains(h.Security.AssetCategoryId.Value);
                })
                .ToList();

            foreach (var holding in unmappedInAccount)
            {
                holdingRecommendations.Add(new HoldingRecommendationDto
                {
                    HoldingId = holding.Id,
                    Ticker = holding.Security?.Ticker ?? "Unknown",
                    SecurityName = holding.Security?.Name ?? "Unknown",
                    CategoryId = holding.Security?.AssetCategoryId,
                    CategoryName = holding.Security?.AssetCategory?.Name ?? "[Unmapped]",
                    CurrentValue = holding.Value,
                    SuggestedChange = 0,
                    Recommendation = "Assign category"
                });
            }

            accountBreakdowns.Add(new AccountBreakdownDto
            {
                AccountId = accountGroup.Key,
                AccountName = account?.Name ?? $"Account {accountGroup.Key}",
                AccountValue = accountValue,
                PercentOfTotal = Math.Round((accountValue / totalValue) * 100, 2),
                CategoryComparisons = accountCategoryComparisons,
                HoldingRecommendations = holdingRecommendations.OrderBy(h => h.CategoryName).ThenBy(h => h.Ticker).ToList()
            });
        }

        return new CompareResultDto
        {
            ModelName = model.Name,
            TotalValue = totalValue,
            Comparisons = comparisons,
            UnmappedHoldings = unmappedHoldings,
            AccountBreakdowns = accountBreakdowns.OrderBy(a => a.AccountName).ToList()
        };
    }
}
