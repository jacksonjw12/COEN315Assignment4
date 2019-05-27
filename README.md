Jackson Wheeler 5/27/19 COEN 315 Assignment 4

Assignment 4, COEN 315

Accomplished using node js, and bootstrap/jquery

Apache configuration:

<pre>


<VirtualHost *:80>
        ServerName bart.jacksonwheelers.space
        ProxyPreserveHost On
        ProxyPass / http://127.0.0.1:8082/
        ProxyPassReverse / http://127.0.0.1:8082/
        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>


</pre>


Directory Structure


Server Code
	server.js + index.js

Client
	public/html/index.html
	public/js/index.js
	public/css/index.css