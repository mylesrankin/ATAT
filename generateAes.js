var CryptoJS = require("crypto-js");

var url = '';

var ciphertext = CryptoJS.AES.encrypt('car-search?sort=sponsored&radius=90&postcode=b904uh&onesearchad=Used&onesearchad=Nearly%20New&onesearchad=New&make=BMW&model=M2%27', 'bmw');

console.log(ciphertext.toString())

// U2FsdGVkX1+fmOQDZMWJ2eHqPo1jWGeFBbYLSBXEknIBqUZWmUcUrgF2He1kyQGh+EExAPiyRqAH2XxLdMjuXSTv7BIkIOPtwCagF5whI+RYe4emEoGwT8Wbzqj7mX89JzDQQ/04uz1QUZkCMzoTUhyxVsAzcyg/h8s69yVIABd+R7uGjoZVUXcJQ9YIFHck8NtRyhLVtdK3dOvb+XCnPQ==
