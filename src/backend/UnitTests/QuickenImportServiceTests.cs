using rebalancer.API.Services;
using rebalancer.Domain;

namespace UnitTests;

public class QuickenImportServiceTests
{
    private static readonly List<Security> Securities = new()
    {
        new Security(1, "VTI", "Vanguard Total Stock Market ETF", PositionType.ETF, AssetClass.Equity),
        new Security(2, "BND", "Vanguard Total Bond Market ETF", PositionType.ETF, AssetClass.FixedIncome),
        new Security(3, "FXAIX", "Fidelity 500 Index Fund", PositionType.MutualFund, AssetClass.Equity),
    };

    [Fact]
    public void Preview_CsvWithSymbolColumn_MatchesByTicker()
    {
        var csv = """
            Portfolio Value - As of 10/25/2026
            Brokerage

            Security,Symbol,Shares,Price,Market Value
            Vanguard Total Stock Mkt,VTI,"1,234.5678",250.00,"$308,641.95"
            Vanguard Total Bond,bnd,100,72.10,"7,210.00"
            Cash,,,,"1,500.00"
            Total,,,,"317,351.95"
            """;

        var result = QuickenImportService.Preview(csv, Securities);

        Assert.Empty(result.Warnings);
        Assert.Equal(2, result.Rows.Count);
        Assert.Equal(1, result.Rows[0].SecurityId);
        Assert.Equal(1234.5678m, result.Rows[0].Shares);
        Assert.Equal(2, result.Rows[1].SecurityId);
        Assert.Equal(100m, result.Rows[1].Shares);
    }

    [Fact]
    public void Preview_QuickenPortfolioValueExport_ParsesAllHoldings()
    {
        var csv = """
            Portfolio Value
            As of Today: 10/25/2026
            1 Account, All Securities

            "Security",,"Symbol","Shares","Quote / Price","Market Value"
            -------------------------,-------------------------,-------------------------,-------------------------,-------------------------,-------------------------
            "Vanguard Federal Money Market Fund",,"VMFXX","22.27","1.00","22.27"
            "Vanguard Total Stock Market Index Fund Admiral Shares",,"VTI","2,761.594","181.59","501,477.85"
            "Fidelity 500 Index Fund",,"FXAIX","18,492.882","9.36","173,093.38"
            -------------------------,-------------------------,-------------------------,-------------------------,-------------------------,-------------------------
            "Total",,,"","","1,285,214.18"
            """;

        var result = QuickenImportService.Preview(csv, Securities);

        Assert.Empty(result.Warnings);
        Assert.Equal(new[] { "VMFXX", "VTI", "FXAIX" }, result.Rows.Select(r => r.Ticker));
        Assert.Equal(new int?[] { null, 1, 3 }, result.Rows.Select(r => r.SecurityId));
        Assert.Equal(2761.594m, result.Rows[1].Shares);
        Assert.Equal(18492.882m, result.Rows[2].Shares);
    }

    [Fact]
    public void Preview_TabDelimitedWithoutSymbol_MatchesByNameOrTickerAsName()
    {
        var text = "Portfolio Value Report\n\n\tSecurity\tShares\tQuote/Price\tMarket Value\n"
                 + "\tFidelity 500 Index Fund\t50.5\t200.00\t10,100.00\n"
                 + "\tVTI\t10\t250.00\t2,500.00\n"
                 + "\tTotal Investments\t\t\t12,600.00\n";

        var result = QuickenImportService.Preview(text, Securities);

        Assert.Equal(new int?[] { 3, 1 }, result.Rows.Select(r => r.SecurityId));
        Assert.Equal(50.5m, result.Rows[0].Shares);
    }

    [Fact]
    public void Preview_UnknownSecurity_IsReturnedUnmatched()
    {
        var csv = "Security,Symbol,Shares\nSome Stock,ZZZZ,5\n";

        var result = QuickenImportService.Preview(csv, Securities);

        var row = Assert.Single(result.Rows);
        Assert.Null(row.SecurityId);
        Assert.Equal("ZZZZ", row.Ticker);
        Assert.Equal("Some Stock", row.Name);
    }

    [Fact]
    public void Preview_SameSecurityListedTwice_CombinesShares()
    {
        var csv = "Security,Symbol,Shares\nVanguard Total Stock,VTI,10\nVanguard Total Stock,VTI,2.5\n";

        var result = QuickenImportService.Preview(csv, Securities);

        var row = Assert.Single(result.Rows);
        Assert.Equal(12.5m, row.Shares);
    }

    [Fact]
    public void Preview_ZeroShareRows_AreSkipped()
    {
        var csv = "Security,Symbol,Shares\nVanguard Total Stock,VTI,0\nVanguard Total Bond,BND,3\n";

        var result = QuickenImportService.Preview(csv, Securities);

        Assert.Equal(2, Assert.Single(result.Rows).SecurityId);
    }

    [Fact]
    public void Preview_UnreadableShares_AddsWarning()
    {
        var csv = "Security,Symbol,Shares\nVanguard Total Stock,VTI,lots\n";

        var result = QuickenImportService.Preview(csv, Securities);

        Assert.Empty(result.Rows);
        Assert.Contains(result.Warnings, w => w.Contains("Line 2") && w.Contains("lots"));
    }

    [Fact]
    public void Preview_NoHeaderRow_AddsWarning()
    {
        var result = QuickenImportService.Preview("just,some,numbers\n1,2,3\n", Securities);

        Assert.Empty(result.Rows);
        Assert.Contains(result.Warnings, w => w.Contains("header"));
    }
}
