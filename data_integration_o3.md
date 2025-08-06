Below is a playbook that teams using **optionsDashboardMVP** can adopt to add *reliably-free*\* options market data.  Each source is followed by the key facts you need (coverage, latency, limits) and a Python-centric “plug-in” snippet you can drop into your project’s data layer.

| Tier                                | Source                               | What you get (free)                                                                                                               | How to use it quickly                                                                                                                                                                                                                                                                                                                                |                    |
| ----------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **1 – “Drop-in, no signup”**        | **`yfinance` (Yahoo Finance)**       | • Complete US-equity option chains, bid/ask & Greeks (≈15-min delay)<br>• All expiration dates in one call                        | `python<br>import yfinance as yf<br>tk = yf.Ticker('AAPL')<br>for exp in tk.options:<br>&nbsp;&nbsp;chain = tk.option_chain(exp)<br>&nbsp;&nbsp;db.store(chain.calls, chain.puts)<br>` ([CodeArmo][1])                                                                                                                                               |                    |
| **2 – “Free key, generous limits”** | **Free Options Chain (FOC) library** | • Pulls fresh NASDAQ option chains & Greeks<br>• No account, pip-installable; internally scrapes NASDAQ quotes so latency ≈5-10 s | `python<br>from FOC import FOC, OptionType<br>foc = FOC()<br>df = foc.get_options_chain_greeks('MSFT','2025-09-19',OptionType.CALL)<br>` ([GitHub][2])                                                                                                                                                                                               |                    |
|                                     | **Alpha Vantage**                    | • New OPTIONS endpoint in 2025 free tier (5 req / min, daily cap)<br>• OPRA-consolidated prices, EOD Greeks                       | `python<br>import requests, os<br>key=os.getenv('ALPHAVANTAGE_KEY')<br>url='https://www.alphavantage.co/query'<br>params={'function':'OPTIONS_DERIVATIVES','symbol':'SPY','apikey':key}<br>data = requests.get(url,params=params).json()<br>` ([alphavantage.co][3])                                                                                 |                    |
| **3 – “Signup sandbox”**            | **Tradier Brokerage API (sandbox)**  | • Real-time chain, hourly Greeks via ORATS<br>• Streaming quotes over WebSockets                                                  | `python<br>import requests, os<br>token=os.getenv('TRADIER_TOKEN')<br>headers={'Authorization':f'Bearer {token}','Accept':'application/json'}<br>p={'symbol':'AAPL','expiration':'2025-09-19'}<br>chains=requests.get('https://sandbox.tradier.com/v1/markets/options/chains',headers=headers,params=p).json()<br>` ([documentation.tradier.com][4]) |                    |
| **4 – “Free trial / capped plan”**  | **MarketData.app**                   | • Tick-level option quotes & Greeks (1 req / sec on free tier)<br>• Powerful filters (delta range, OI floor, etc.)                | REST: `/options/chain/{underlying}?expiration=...` → JSON                                                                                                                                                                                                                                                                                            | ([Market Data][5]) |

\*All of these are free for personal / dev use.  Production or commercial redistribution usually requires a paid plan—make sure terms fit your use-case.

---

### Integrating with **optionsDashboardMVP**

1. **Abstract the data layer**
   Create `data_providers/base.py` with a simple interface (`get_chain(ticker, expiry)` returning a Pandas DF).  Each provider above becomes a subclass, e.g. `YahooProvider`, `FOCProvider`, etc.

2. **Fallback logic**
   In `data_providers/__init__.py`, add a factory that tries sources in order of freshness (Tradier → MarketData → Alpha Vantage → yfinance/FOC).  Cache results in Redis/PostgreSQL for 10–15 min to stay within rate limits.

3. **Environment-driven config**
   Read API keys and preferred provider list from `.env`; default to yfinance when keys are absent so contributors can clone & run with no setup friction.

4. **Async jobs**
   Use `apscheduler` or Celery to pre-fetch the next week’s expiries at market open; store chains in your DB so the dashboard loads instantly.

5. **Greeks & IV normalisation**
   Different feeds name Greek columns differently (`iv`, `impliedVolatility`, `ivMean`).  Add a normaliser in your base class to map everything to a common schema before storage.

6. **Compliance & disclaimers**
   Display “Data delayed (x) min, not for trading” on the UI when using anything other than Tradier’s live feed to keep FINRA happy.

---

#### Quick sanity test

```bash
pip install yfinance freeoptionschain python-dotenv requests pandas
python - <<'PY'
import yfinance as yf, pandas as pd
print("AAPL expiries:", yf.Ticker("AAPL").options[:5])
from FOC import FOC, OptionType
print("FOC snapshot:", FOC().get_options_chain("AAPL","2025-09-19",OptionType.CALL).head())
PY
```

If both return data, your environment is ready; wire the functions into your dashboard’s data-fetching service and you’ll have resilient, cost-free options coverage.

Need help wiring any of these into the repo, or choosing the right caching / DB schema?  Let me know and we can jump into code specifics.

[1]: https://www.codearmo.com/python-tutorial/options-trading-getting-options-data-yahoo-finance?utm_source=chatgpt.com "Get Free Options Data with Python: Yahoo finance & ..."
[2]: https://github.com/benjamincham/freeoptionschain "GitHub - benjamincham/freeoptionschain: Free Options Chain"
[3]: https://www.alphavantage.co/ "Free Stock APIs in JSON & Excel | Alpha Vantage"
[4]: https://documentation.tradier.com/brokerage-api/markets/get-options-chains?utm_source=chatgpt.com "How to get an option chain | Brokerage API Documentation"
[5]: https://www.marketdata.app/data/options/ "Options Data – API & Google Sheets Add-On | Market Data"
