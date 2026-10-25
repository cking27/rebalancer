using System.Globalization;
using System.Text;
using rebalancer.API.Controllers;
using rebalancer.Domain;

namespace rebalancer.API.Services;

/// <summary>
/// Parses a single-account Quicken holdings export (Portfolio Value report saved as CSV or
/// tab-delimited text) and matches each row to a known security. Pure — callers load the data.
/// </summary>
public static class QuickenImportService
{
    private static readonly string[] SharesHeaders = { "shares", "quantity", "qty", "units" };
    private static readonly string[] SymbolHeaders = { "symbol", "ticker" };
    private static readonly string[] NameHeaders = { "security", "name", "security name", "description", "investment", "holding" };

    public static HoldingImportPreviewDto Preview(string text, IReadOnlyCollection<Security> securities)
    {
        var parsed = Parse(text);

        var byTicker = securities
            .GroupBy(s => s.Ticker.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        var byName = securities
            .GroupBy(s => s.Name.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        Security? Match(ParsedRow row)
        {
            if (!string.IsNullOrEmpty(row.Ticker) && byTicker.TryGetValue(row.Ticker, out var s))
                return s;
            if (!string.IsNullOrEmpty(row.Name) && byName.TryGetValue(row.Name, out s))
                return s;
            // People often name securities by their ticker in Quicken
            if (!string.IsNullOrEmpty(row.Name) && byTicker.TryGetValue(row.Name, out s))
                return s;
            return null;
        }

        // Quicken can list the same security more than once (e.g. per lot) — combine them
        var rows = parsed.Rows
            .Select(r => (Row: r, Security: Match(r)))
            .GroupBy(x => x.Security?.Id.ToString() ?? $"?{x.Row.Ticker}|{x.Row.Name}".ToUpperInvariant())
            .Select(g =>
            {
                var first = g.First();
                return new HoldingImportRowDto
                {
                    Line = first.Row.Line,
                    Name = first.Row.Name,
                    Ticker = first.Row.Ticker,
                    Shares = g.Sum(x => x.Row.Shares),
                    SecurityId = first.Security?.Id,
                };
            })
            .OrderBy(r => r.Line)
            .ToList();

        return new HoldingImportPreviewDto { Rows = rows, Warnings = parsed.Warnings };
    }

    internal record ParsedRow(int Line, string Name, string Ticker, decimal Shares);

    internal record ParseResult(List<ParsedRow> Rows, List<string> Warnings);

    internal static ParseResult Parse(string text)
    {
        var rows = new List<ParsedRow>();
        var warnings = new List<string>();

        var lines = text.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n');
        var delimiter = text.Contains('\t') ? '\t' : ',';

        int sharesCol = -1, symbolCol = -1, nameCol = -1;
        var headerFound = false;

        for (var i = 0; i < lines.Length; i++)
        {
            var lineNumber = i + 1;
            var cells = SplitLine(lines[i], delimiter);
            if (cells.All(string.IsNullOrWhiteSpace))
                continue;

            if (!headerFound)
            {
                var normalized = cells.Select(NormalizeHeader).ToList();
                sharesCol = normalized.FindIndex(c => SharesHeaders.Contains(c));
                symbolCol = normalized.FindIndex(c => SymbolHeaders.Contains(c));
                nameCol = normalized.FindIndex(c => NameHeaders.Contains(c));
                headerFound = sharesCol >= 0 && (symbolCol >= 0 || nameCol >= 0);
                continue;
            }

            var name = Cell(cells, nameCol);
            var ticker = Cell(cells, symbolCol);
            var sharesText = Cell(cells, sharesCol);

            if (name.Length == 0 && ticker.Length == 0)
                continue;
            // Separator lines like "-------,-------"
            if (cells.All(c => c.Trim().All(ch => ch is '-' or '=')))
                continue;
            if (name.StartsWith("total", StringComparison.OrdinalIgnoreCase))
                continue;
            // Account headings, cash lines and the like have no share count
            if (sharesText.Length == 0)
                continue;

            if (!TryParseNumber(sharesText, out var shares))
            {
                warnings.Add($"Line {lineNumber}: couldn't read shares \"{sharesText}\" for {Label(name, ticker)}");
                continue;
            }

            if (shares == 0)
                continue;

            rows.Add(new ParsedRow(lineNumber, name, ticker, shares));
        }

        if (!headerFound)
            warnings.Add("Couldn't find a header row with a Shares column and a Security or Symbol column.");

        return new ParseResult(rows, warnings);
    }

    private static string Label(string name, string ticker) =>
        ticker.Length > 0 && name.Length > 0 ? $"{name} ({ticker})" : name.Length > 0 ? name : ticker;

    private static string Cell(List<string> cells, int index) =>
        index >= 0 && index < cells.Count ? cells[index].Trim() : string.Empty;

    private static string NormalizeHeader(string cell) =>
        cell.Trim().TrimEnd(':').ToLowerInvariant();

    private static bool TryParseNumber(string text, out decimal value)
    {
        var cleaned = text.Replace(",", "").Replace("$", "").Trim();
        var negative = cleaned.StartsWith('(') && cleaned.EndsWith(')');
        if (negative)
            cleaned = cleaned[1..^1];

        if (!decimal.TryParse(cleaned, NumberStyles.Number, CultureInfo.InvariantCulture, out value))
            return false;

        if (negative)
            value = -value;
        return true;
    }

    // Splits one line, honoring double-quoted fields with "" escapes
    private static List<string> SplitLine(string line, char delimiter)
    {
        var cells = new List<string>();
        var current = new StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var c = line[i];
            if (inQuotes)
            {
                if (c == '"' && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                }
                else if (c == '"')
                    inQuotes = false;
                else
                    current.Append(c);
            }
            else if (c == '"')
                inQuotes = true;
            else if (c == delimiter)
            {
                cells.Add(current.ToString());
                current.Clear();
            }
            else
                current.Append(c);
        }

        cells.Add(current.ToString());
        return cells;
    }
}
