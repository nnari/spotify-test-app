const express = require('express');
const querystring = require('querystring');
const request = require('request');
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const cors = require('cors');

const PORT = 3000;

const client_id = ''; // Your client id
const client_secret = ''; // Your secret
const redirect_uri = ''; // Your redirect uri
let token = "";

const app = express();

app.use(express.static(__dirname + '/public'))
  .use(cookieParser())
  .use(cors())


//We send this request to allow our app to log in on the user's behalf.
//We are not actually getting anything here since this is a part of our backend code.
//This is listening on localhost:3000/login for GET requests, and responds with a redirect to the Spotify API to authorize.
app.get('/login', function (req, res) {
  var scope = 'user-read-private user-read-email';
  res.redirect("https://accounts.spotify.com/authorize?" +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
    }));
});

//Spotify sends us back to http://localhost:3000 here, so we can get the key that permits us to act on the user's behalf.
app.get('/callback', function (req, res) {

  var code = req.query.code;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + Buffer.from(client_id + ":" + client_secret).toString('base64')
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {

      var access_token = body.access_token,
        refresh_token = body.refresh_token;

      var options = {
        url: 'https://api.spotify.com/v1/me',
        headers: { 'Authorization': 'Bearer ' + access_token },
        json: true
      };

      // use the access token to access the Spotify Web API
      request.get(options, function (error, response, body) {
        console.log(body);
      });

      // we can also pass the token to the browser to make requests from there
      res.redirect('/#' +
        querystring.stringify({
          access_token: access_token,
          refresh_token: refresh_token
        }));
    } else {
      res.redirect('/#' +
        querystring.stringify({
          error: 'invalid_token'
        }));
    }
  });
}
);

app.get('/refresh_token', function (req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + Buffer.from(client_id + ":" + client_secret).toString('base64') },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.listen(PORT, () => {
  console.log('Spotify test app listening on http://localhost:' + PORT);
});