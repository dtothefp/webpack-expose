import qs from 'query-string';

export default function() {
  return qs.parse(window.location);
}
