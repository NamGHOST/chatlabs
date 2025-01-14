-- Insert the Yahoo Finance tool
INSERT INTO platform_tools (id, name, description, version, enabled, schema)
VALUES (
  gen_random_uuid(),
  'Yahoo Finance',
  'Tool for fetching real-time stock and options data from Yahoo Finance',
  '1.0.0',
  true,
  jsonb_build_object(
    'functions', jsonb_build_array(
      jsonb_build_object(
        'id', 'get_stock_data',
        'toolFunction', 'getStockData',
        'description', 'Get real-time and historical stock data for a given symbol',
        'resultProcessingMode', 'SYNCHRONOUS',
        'parameters', jsonb_build_array(
          jsonb_build_object(
            'name', 'symbol',
            'description', 'Stock symbol (e.g. AAPL)',
            'required', true,
            'schema', jsonb_build_object('type', 'string')
          ),
          jsonb_build_object(
            'name', 'range',
            'description', 'Time range for historical data (e.g. 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)',
            'required', false,
            'schema', jsonb_build_object('type', 'string')
          )
        )
      ),
      jsonb_build_object(
        'id', 'get_option_chain',
        'toolFunction', 'getOptionChain',
        'description', 'Get option chain data for a given symbol and expiration date',
        'resultProcessingMode', 'SYNCHRONOUS',
        'parameters', jsonb_build_array(
          jsonb_build_object(
            'name', 'symbol',
            'description', 'Stock symbol (e.g. AAPL)',
            'required', true,
            'schema', jsonb_build_object('type', 'string')
          ),
          jsonb_build_object(
            'name', 'expirationDate',
            'description', 'Option expiration date (YYYY-MM-DD)',
            'required', true,
            'schema', jsonb_build_object('type', 'string')
          )
        )
      )
    )
  )
); 