import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // Virtual Users
  duration: '10s', // Test duration
};

export default function () {
    
  const params = { headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzMEh0andXdEIwREJPMTZXd2g0bm0iLCJzaWQiOiJfTFVhb1lXLXRDVjRSR2M4Ny1hc3YiLCJpYXQiOjE3NDE3NjE5NTMsImV4cCI6MTc0MjM2Njc1M30.twazH5llUKcXYZ12zZPGKAS7Uo8JIRKzx19eb5zDH3g' } };
  const res = http.get('http://127.0.0.1:8787/api/v1/pages', params);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1); // Sleep for 1 second between iterations
}