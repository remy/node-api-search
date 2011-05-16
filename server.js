var jsdom = require('jsdom'),
    fs = require('fs'),
    path = require('path'),
    method = process.argv[2],
    connect = require('connect'),
    api = null;

console.log('version: ' + process.version);

function getMethod(method) {
  // #id searches in jQuery require a double escape on periods
  var $root = api('#' + method.replace(/\./, '\\.') ),
      html = '';

  if (!$root.length && method.indexOf('.') !== -1) {
    // go look up possible api methods
    html = '<ul class="possibles">';
    api('h3').filter(function () { 
      return this.id.indexOf(method) === 0; 
    }).each(function () {
      html += '<li id="' + this.id + '">' + api(this).text() + '</li>';
    });
    html += '</ul>';    
  } else if ($root.length) {
    hmtl = $root[0].outerHTML;
    $root.nextUntil('h2,h3').each(function () {
      html += '<' + this.nodeName + '>' + api(this).html() + '</' + this.nodeName + '>';
    });    
  }
  
  return html;
}

var routes = function (app) {
  app.get('/api/:method', function (req, res) {
    res.writeHead(200, { 'content-type' : 'text/html' });
    if (req.params.method && api !== null) {
      res.write(getMethod(req.params.method));
    }
    res.end('');
  });
  
  app.get('/:method', function (req, res) {
    fs.readFile('index.html', function (err, data) {
      var html = data.toString();
      jsdom.env(html, [ 'jquery.min.js' ], function (errors, window) {
        res.writeHead(200, { 'content-type' : 'text/html' });
        window.$('#result').html(getMethod(req.params.method));
        window.$('input').val(req.params.method);
        res.write(window.document.innerHTML);
        res.end();        
      });
    });
  });
};


// note - this takes a little while...
jsdom.env('http://nodejs.org/docs/' + process.version + '/api/all.html', [
  'jquery.min.js'
], function(errors, window) {  
  api = window.$;
  console.log('loaded api.');
});

// don't start the server until the API is loaded in to memory
connect.createServer(
  // connect.logger(),
  connect.static(__dirname), // note the order matters - otherwise we're hitting our router
  connect.router(routes)
).listen(parseInt(process.argv[2]) || 80);
