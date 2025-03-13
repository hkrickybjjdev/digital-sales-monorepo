## Run the Test:

Open your terminal, navigate to the directory where you saved your script.js file, and run the following command:

```bash
k6 run script.js
```

## Analyze the Results:

k6 will output real-time statistics to your terminal. Here's a description of some key metrics:

`vus`
:   Number of currently active virtual users.  Each virtual user simulates a concurrent user accessing your API.

`vus_max`
:   Maximum number of virtual users that were active during the test.

`iterations`
:   Number of complete test iterations that were executed.

`iteration_duration`
:   The average time taken for each iteration to complete.

`http_reqs`
:   Total number of HTTP requests made during the test.

`http_req_duration`
:   Duration of HTTP requests, providing statistics like: `min` (minimum), `max` (maximum), `avg` (average), `p90` (90th percentile), `p95` (95th percentile).  The `p90` value means 90% of requests were faster than this time.

`http_req_failed`
:   Number of HTTP requests that resulted in an error (e.g., non-2xx or 3xx status code).

`checks`
:   The number of checks (assertions) that passed and failed.  This helps you verify that your API is behaving as expected.

