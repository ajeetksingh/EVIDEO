<?php

$id=$_GET['media_id'];
$media_creator=$_GET['media_creator'];
$duration=$_GET['duration'];
$media_name=$_GET['media_name'];
$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);

$sql=mysql_query("select * from media_info where media_id='$id'");
echo "$sql";

while($row=mysql_fetch_array($sql))
{
	$flag=0;	
	$media_id=$row['media_id'];
	if($media_id==$id)
	{
		$flag=1;
		break;
	}

}
if($flag==0)
{
mysql_query("INSERT INTO media_info(media_id, media_name, media_creator, duration) VALUES  ('$id', '$media_name', '$media_creator', '$duration')");
}

mysql_close($con);
 //header( "Location: http://evideo.iitj.ac.in/engage/ui/watch.html?id=$txt" ) ;
?>
