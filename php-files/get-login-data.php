<?php 
$user=$_GET['user'];
$pass=$_GET['pass'];
if(!$user || !$pass)
{
	$response[] = array('response'=>0);
	$data=json_encode($response);
}
else{	
$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);
$response=array();
$sql=mysql_query("select * from user where username='$user'"); 
$row=mysql_fetch_array($sql) ;
{
$username=$row['username'];
//echo "$username";
$password=$row['password'];
//echo "$password";
}

if (!strcmp($username,$user) && !strcmp($password,$pass))
{
	$response[] = array('response'=>1);
	$data=json_encode($response);
}
else
{
	$response[] = array('response'=>0);
	$data=json_encode($response);
}}

echo $_GET['jsoncallback'] . '(' . $data . ');';
?> 
