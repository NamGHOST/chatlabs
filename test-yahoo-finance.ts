const { yahooFinanceTool } = require('./lib/platformTools/library/yahooFinanceTool');

async function testYahooFinance() {
  try {
    // Test stock data
    console.log('Testing get_stock_data...');
    const stockResult = await yahooFinanceTool.toolsFunctions[0].toolFunction({
      symbol: 'AAPL',
      range: '1mo'
    });
    console.log('Stock Data:', JSON.stringify(stockResult, null, 2));

    // Test options data with closer expiration
    console.log('\nTesting get_option_chain...');
    const optionsResult = await yahooFinanceTool.toolsFunctions[1].toolFunction({
      symbol: 'AAPL',
      expirationDate: '2025-01-17'  // Using the closest expiration
    });
    console.log('Options Data:', JSON.stringify(optionsResult, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testYahooFinance(); 