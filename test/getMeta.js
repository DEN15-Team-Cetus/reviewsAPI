import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '5s',
};

export default function () {
  http.get('http://localhost:1234/reviews/meta?product_id=489679');
}

//k6 run ./test/getMeta.js