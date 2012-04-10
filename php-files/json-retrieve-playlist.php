<?php 
$id=$_GET['id'];

$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

$sql=mysql_query("select * from playlist_data where id='$id'"); 
$response = array();
while($row=mysql_fetch_array($sql)) 
{ 
$playlist=$row['playlist_name'];
$pId=$row['id'];
$url=$row['playlist_url']; 
$response[] = array('id'=> $pId, 'url'=>$url, 'playlist'=>$playlist);// 'url'=> $url, 'description'=> $description, 'start'=>$start, 'stop'=>$stop);
} 

$data=json_encode($response);
//echo $data;
//$json_res = $info['data'];
echo $_GET['jsoncallback'] . '(' . $data . ');';
/*$fp = fopen('results.json', 'w')or die("can't open or create file".mysql_error());
fwrite($fp, json_encode($response));

fclose($fp);*/


?> 
