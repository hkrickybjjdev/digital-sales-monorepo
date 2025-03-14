import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10, // Virtual Users
  duration: '10s', // Test duration
};

export default function () {
    
  const params = { headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIwMTk1OGFkYi1mNTM3LTczYWQtYTM5My1kYTYwMWE4MjFjYTUiLCJzaWQiOiIwMTk1OTI2Yy0wOGEyLTcwNDMtODlkNC1lYzE0NDBmODdmZTkiLCJpYXQiOjE3NDE5MTgzMDgsImV4cCI6MTc0MjUyMzEwOH0.mmVGSLHuRAM2xkYPz4OcwAHRokw4e_XR5WYCvcSU37E' } };
  const res = http.get('http://127.0.0.1:8787/api/v1/auth/me', params);
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1); // Sleep for 1 second between iterations
}