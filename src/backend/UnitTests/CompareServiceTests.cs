using rebalancer.API.Controllers;
using rebalancer.API.Services;
using rebalancer.Domain;

namespace UnitTests;

public class CompareServiceTests
{
    // Category tree:
    //   Equity (60%)
    //     US Stocks (70%)      -> effective 42%
    //     International (30%)  -> effective 18%
    //   Bonds (40%)
    //   Crypto (not in model)
    private const int Equity = 1, Us = 2, Intl = 3, Bonds = 4, Crypto = 5;

    private static readonly List<AssetCategory> Categories = new()
    {
        new AssetCategory(Equity, "Equity", null, 0),
        new AssetCategory(Us, "US Stocks", Equity, 0),
        new AssetCategory(Intl, "International", Equity, 1),
        new AssetCategory(Bonds, "Bonds", null, 1),
        new AssetCategory(Crypto, "Crypto", null, 2),
    };

    private static Model BuildModel()
    {
        var model = new Model(1, "Test Model", null);
        model.SetAllocations(new[]
        {
            Allocation(1, Equity, 60),
            Allocation(2, Us, 70),
            Allocation(3, Intl, 30),
            Allocation(4, Bonds, 40),
        });
        return model;
    }

    private static ModelAllocation Allocation(int id, int categoryId, decimal percentage)
    {
        var allocation = new ModelAllocation(id, 1, categoryId, percentage);
        SetPrivate(allocation, nameof(ModelAllocation.AssetCategory), Categories.Single(c => c.Id == categoryId));
        return allocation;
    }

    // Price of 1 so that shares == value
    private static Security Sec(int id, string ticker, int? categoryId) =>
        new(id, ticker, ticker, PositionType.ETF, AssetClass.Equity, categoryId, 1m);

    private static Holding Hold(int id, Security security, decimal value, int accountId = 1)
    {
        var holding = new Holding(id, accountId, security.Id, value);
        SetPrivate(holding, nameof(Holding.Security), security);
        SetPrivate(holding, nameof(Holding.Account), new Account(accountId, $"Account {accountId}"));
        return holding;
    }

    private static void SetPrivate(object target, string property, object? value) =>
        target.GetType().GetProperty(property)!.SetValue(target, value);

    private static CompareResultDto Compare(params Holding[] holdings) =>
        CompareService.Compare(BuildModel(), holdings, Categories);

    private static CategoryComparisonDto Comparison(CompareResultDto result, int categoryId) =>
        result.Comparisons.Single(c => c.CategoryId == categoryId);

    [Fact]
    public void EffectiveTarget_MultipliesDownParentChain()
    {
        var result = Compare(Hold(1, Sec(1, "VTI", Us), 10_000));

        Assert.Equal(60m, Comparison(result, Equity).TargetPercentage);
        Assert.Equal(42m, Comparison(result, Us).TargetPercentage);
        Assert.Equal(18m, Comparison(result, Intl).TargetPercentage);
        Assert.Equal(40m, Comparison(result, Bonds).TargetPercentage);
    }

    [Fact]
    public void OnlyLeafAllocations_GetBuySellRecommendations()
    {
        var result = Compare(
            Hold(1, Sec(1, "VTI", Us), 5_000),
            Hold(2, Sec(2, "VXUS", Intl), 1_000),
            Hold(3, Sec(3, "BND", Bonds), 4_000));

        var equity = Comparison(result, Equity);
        Assert.False(equity.IsLeaf);
        Assert.Equal("On target", equity.Recommendation);

        Assert.True(Comparison(result, Us).IsLeaf);
        Assert.Equal("Sell $800", Comparison(result, Us).Recommendation);
        Assert.Equal("Buy $800", Comparison(result, Intl).Recommendation);
        Assert.Equal("On target", Comparison(result, Bonds).Recommendation);
    }

    [Fact]
    public void NonLeafAllocation_ShowsOverUnder()
    {
        var result = Compare(
            Hold(1, Sec(1, "VTI", Us), 7_000),
            Hold(2, Sec(2, "BND", Bonds), 3_000));

        Assert.Equal("Over by $1,000", Comparison(result, Equity).Recommendation);
    }

    [Theory]
    [InlineData(0.4, "On target")]
    [InlineData(5, "On target")]
    [InlineData(10, "On target")]
    [InlineData(10.01, "Sell $10")]
    public void AggregateLeafRecommendation_RespectsThreshold(decimal overBy, string expected)
    {
        // US target is $4,200 and International $1,800 of a $10,000 portfolio
        var result = Compare(
            Hold(1, Sec(1, "VTI", Us), 4_200 + overBy),
            Hold(2, Sec(2, "VXUS", Intl), 1_800 - overBy),
            Hold(3, Sec(3, "BND", Bonds), 4_000));

        Assert.Equal(expected, Comparison(result, Us).Recommendation);
    }

    [Fact]
    public void HoldingRecommendations_DistributedProportionallyWithinCategory()
    {
        // US is $800 over target; split 60/40 across the two US holdings
        var result = Compare(
            Hold(1, Sec(1, "VTI", Us), 3_000),
            Hold(2, Sec(2, "SCHB", Us), 2_000),
            Hold(3, Sec(3, "VXUS", Intl), 1_000),
            Hold(4, Sec(4, "BND", Bonds), 4_000));

        var recs = result.AccountBreakdowns.Single().HoldingRecommendations;
        Assert.Equal(-480m, recs.Single(r => r.Ticker == "VTI").SuggestedChange);
        Assert.Equal(-320m, recs.Single(r => r.Ticker == "SCHB").SuggestedChange);
        Assert.Equal(800m, recs.Single(r => r.Ticker == "VXUS").SuggestedChange);
        Assert.Equal("Hold", recs.Single(r => r.Ticker == "BND").Recommendation);
    }

    [Fact]
    public void HoldingRecommendations_HoldWhenWithinThreshold()
    {
        var result = Compare(
            Hold(1, Sec(1, "VTI", Us), 4_205),
            Hold(2, Sec(2, "VXUS", Intl), 1_795),
            Hold(3, Sec(3, "BND", Bonds), 4_000));

        var recs = result.AccountBreakdowns.Single().HoldingRecommendations;
        Assert.All(recs, r => Assert.Equal("Hold", r.Recommendation));
        Assert.All(recs, r => Assert.Equal(0m, r.SuggestedChange));
    }

    [Fact]
    public void EmptyLeafCategory_SuggestsNewPosition()
    {
        var result = Compare(
            Hold(1, Sec(1, "VTI", Us), 4_200),
            Hold(2, Sec(2, "VXUS", Intl), 1_800),
            Hold(3, Sec(3, "SPY", Us), 4_000));

        var rec = result.AccountBreakdowns.Single().HoldingRecommendations.Single(r => r.Ticker == "[New Bonds]");
        Assert.Equal(4_000m, rec.SuggestedChange);
        Assert.Equal("Buy $4,000 in Bonds", rec.Recommendation);
    }

    [Fact]
    public void CompositeSecurity_SplitsValueAcrossComponents()
    {
        var usComponent = Sec(10, "US-PART", Us);
        var intlComponent = Sec(11, "INTL-PART", Intl);
        var fund = Sec(12, "VT", null);
        fund.SetCompositions(new[]
        {
            Composition(fund, usComponent, 60),
            Composition(fund, intlComponent, 40),
        });

        var result = Compare(Hold(1, fund, 10_000));

        Assert.Equal(60m, Comparison(result, Us).ActualPercentage);
        Assert.Equal(40m, Comparison(result, Intl).ActualPercentage);
        Assert.Equal(100m, Comparison(result, Equity).ActualPercentage);
        Assert.Empty(result.UnmappedHoldings);

        var compositeRecs = result.AccountBreakdowns.Single().HoldingRecommendations
            .Where(r => r.Ticker == "VT").ToList();
        Assert.All(compositeRecs, r => Assert.Equal("Hold (composite)", r.Recommendation));
        Assert.Equal(6_000m, compositeRecs.Single(r => r.CategoryId == Us).CurrentValue);
        Assert.Equal(4_000m, compositeRecs.Single(r => r.CategoryId == Intl).CurrentValue);
    }

    private static SecurityComposition Composition(Security parent, Security component, decimal percentage)
    {
        var composition = new SecurityComposition(parent.Id, component.Id, percentage);
        SetPrivate(composition, nameof(SecurityComposition.ComponentSecurity), component);
        return composition;
    }

    [Fact]
    public void UnmappedHoldings_IncludeUncategorizedAndOutOfModelSecurities()
    {
        var result = Compare(
            Hold(1, Sec(1, "VTI", Us), 5_000),
            Hold(2, Sec(2, "CASH", null), 1_000),
            Hold(3, Sec(3, "BTC", Crypto), 1_000));

        Assert.Equal(new[] { "BTC", "CASH" }, result.UnmappedHoldings.Select(h => h.Ticker).OrderBy(t => t));

        var recs = result.AccountBreakdowns.Single().HoldingRecommendations;
        Assert.Equal("Assign category", recs.Single(r => r.Ticker == "CASH").Recommendation);
        Assert.Equal("Assign category", recs.Single(r => r.Ticker == "BTC").Recommendation);
    }

    [Fact]
    public void Comparisons_SortedDepthFirstByName()
    {
        var result = Compare(Hold(1, Sec(1, "VTI", Us), 10_000));

        Assert.Equal(
            new[] { "Bonds", "Equity", "International", "US Stocks" },
            result.Comparisons.Select(c => c.CategoryName));
        Assert.Equal(new[] { 0, 0, 1, 1 }, result.Comparisons.Select(c => c.Depth));
    }

    [Fact]
    public void AccountBreakdowns_ComputedPerAccount()
    {
        var result = Compare(
            Hold(1, Sec(1, "VTI", Us), 6_000, accountId: 1),
            Hold(2, Sec(2, "BND", Bonds), 4_000, accountId: 2));

        Assert.Equal(2, result.AccountBreakdowns.Count);
        var first = result.AccountBreakdowns.Single(a => a.AccountId == 1);
        Assert.Equal(60m, first.PercentOfTotal);
        Assert.Equal(100m, first.CategoryComparisons.Single(c => c.CategoryId == Us).ActualPercentage);
        Assert.Equal(2_520m, first.CategoryComparisons.Single(c => c.CategoryId == Us).TargetValue);
    }

    [Fact]
    public void ZeroValuePortfolio_ReturnsHoldingsAsUnmapped()
    {
        var result = Compare(Hold(1, Sec(1, "VTI", Us), 0));

        Assert.Equal(0m, result.TotalValue);
        Assert.Empty(result.Comparisons);
        Assert.Single(result.UnmappedHoldings);
    }
}
