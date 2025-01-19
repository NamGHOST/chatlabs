import { yahooFinanceTool } from './lib/platformTools/library/yahooFinanceTool';

// Main function to run tests
const main = async () => {
  try {
    // Test stock data
    console.log('Testing get_stock_data...');
    const stockResult = await yahooFinanceTool.toolsFunctions[0].toolFunction({
      symbol: 'AAPL',
      range: '1mo'
    });
    console.log('Stock Data:', JSON.stringify(stockResult, null, 2));

    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test options data
    console.log('\nTesting get_option_chain...');
    const optionsResult = await yahooFinanceTool.toolsFunctions[1].toolFunction({
      symbol: 'AAPL',
      expirationDate: '2025-01-17'
    });
    console.log('Options Data:', JSON.stringify(optionsResult, null, 2));

  } catch (error) {
    if (error instanceof Error) {
      console.error('Test failed:', error.message);
    } else {
      console.error('Test failed with unknown error');
    }
    process.exit(1);
  }
};

// Run the tests
main().catch((error) => {
  if (error instanceof Error) {
    console.error('Unhandled error:', error.message);
  } else {
    console.error('Unhandled unknown error');
  }
  process.exit(1);
}); 