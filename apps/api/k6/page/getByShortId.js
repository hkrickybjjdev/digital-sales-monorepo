import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1000, // Virtual Users
  duration: '50s', // Test duration
};

export default function () {
    
  const params = { headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwMTk1OGFkYi1mNTM3LTczYWQtYTM5My1kYTYwMWE4MjFjYTUiLCJzaWQiOiIwMTk1OTI2MS01ZTkyLTcyMDQtOWY0OC1mYzU1ZWUxZWU5NTIiLCJpYXQiOjE3NDE5MTc2MDksImV4cCI6MTc0MjUyMjQwOX0.2lUKmspOzuD7pPRcH2uFKYXEE9fqVSQvxfKOxuXQ2hk' } };
  const res = http.get('http://127.0.0.1:8787/api/v1/pages/s/di7Y4P2m', params);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  // Check for errors
  if (res.status !== 200) {
    console.error(`Request failed with status ${res.status}`);
  }
}