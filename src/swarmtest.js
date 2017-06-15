const swarm = require("swarm-js").at("http://swarm-gateways.net");

const indexHtml =
`<html>
  <body>
    <h3>Dao Casino SWARM TEST</h3>
    <p><a href="http://dao.casino">link to site</a></p>
  </body>
</html>`;


const exampleDApp = {
  ""                     : {type: "text/html", data: indexHtml},
  "/index.html"          : {type: "text/html", data: indexHtml},
}

swarm.upload(exampleDApp)
  .then(console.log)
  .catch(console.log);


// http://swarm-gateways.net/bzz:/35d14082ff7304c0e868343687f5965caa8010aa2334f479becb82a0065382ed
