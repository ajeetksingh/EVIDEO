<?php 
$username=$_GET['user'];

$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

$sql=mysql_query("select id, playlist_name, playlist_url from playlist_data where user_name='$username'"); 
$response = array();
while($row=mysql_fetch_array($sql)) 
{ 
$titleId=$row['id'];
$playlist_name=$row['playlist_name'];
$playlist_url=$row['playlist_url']; 
$response[] = array('title'=> $playlist_name, 'id'=> $titleId, 'url'=>$playlist_url);// 'url'=> $url, 'description'=> $description, 'start'=>$start, 'stop'=>$stop);
} 

$data=json_encode($response);
//echo $data;
//$json_res = $info['data'];
echo $_GET['jsoncallback'] . '(' . $data . ');';
/*$fp = fopen('results.json', 'w')or die("can't open or create file".mysql_error());
fwrite($fp, json_encode($response));

fclose($fp);*/


?> 
