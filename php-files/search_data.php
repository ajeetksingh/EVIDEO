<?php 
$tablename=$_GET['run'];
$title=$_GET['title'];
$user=$_GET['user'];
$var=0;
$con = mysql_connect("localhost","root","123");
if (!$con)
  {
  die('Could not connect: ' . mysql_error());
  }

mysql_select_db("matterhorn", $con);
$response = array();
switch($tablename)
{
	case "annotations":
	//echo "hi";
	$sql=mysql_query("select * from media_info a inner join annotations b on a.media_id=b.media_id where annotations like '%$title%'"); 
	while($row=mysql_fetch_array($sql)) 
	{ 
		//$titleId=$row['id'];
		$media_id=$row['media_id'];
		$media_name=$row['media_name'];
		$media_creator=$row['media_creator'];
		$duration=$row['duration'];
		$description=$row['media_explanation'];
		$annotations=$row['annotations'];
		$start=$row['start'];
		$stop=$row['stop']; 
		//$table_name=$row['table_name'];
		$response[] = array('media_id'=> $media_id, 'title'=>$annotations, 'start'=>$start, 'stop'=>$stop, 'table_name'=>'annotations', 'media_name'=>$media_name, 'media_creator'=>$media_creator, 'duration'=>$duration, 'description'=>$description);
	} 
	break;
	case "Link":
	$sql=mysql_query("select * from media_info a inner join Link b on a.media_id=b.media_id where (title like '%$title%' or description like '%$title%')");
	while($row=mysql_fetch_array($sql)) 
	{ 
		//$titleId=$row['id'];
		$media_id=$row['media_id'];
		$title=$row['title'];
		$url=$row['url'];
		$description=$row['description'];
		$media_name=$row['media_name'];
		$media_creator=$row['media_creator'];
		$duration=$row['duration'];
		$media_description=$row['media_explanation'];
		$start=$row['start'];
		$stop=$row['stop']; 
		//$table_name=$row['table_name'];
		$response[] = array('media_id'=> $media_id, 'title'=>$title, 'description'=>$description, 'start'=>$start, 'stop'=>$stop, 'url'=>$url, 'table_name'=>'Link', 'media_name'=>$media_name, 'media_creator'=>$media_creator, 'duration'=>$duration, 'media_desc'=>$media_description);
	}  
	break;
	case "bookmarks":
	$sql=mysql_query("select * from media_info a inner join bookmarks b on a.media_id=b.media_id where b.user_name='$user' &&(title like '%$title%' or description like '%$title%')"); 
	while($row=mysql_fetch_array($sql)) 
	{ 
		//$titleId=$row['id'];
		$media_id=$row['media_id'];
		$title=$row['title'];
		$start=$row['start'];
		$stop=$row['stop'];
		$description=$row['description']; 
		$media_name=$row['media_name'];
		$media_creator=$row['media_creator'];
		$duration=$row['duration'];
		$media_description=$row['media_explanation'];
		$response[] = array('media_id'=> $media_id, 'title'=>$title, 'description'=>$description, 'start'=>$start, 'stop'=>$stop, 'table_name'=>'bookmarks', 'media_name'=>$media_name, 'media_creator'=>$media_creator, 'duration'=>$duration, 'media_desc'=>$media_description);
	} 
	break;
	case "all":
	$sql=mysql_query("SELECT tabkey.media_id, annotations.annotations, annotations.start as ann_start, annotations.stop as ann_stop, Link.start as link_start,Link.stop as link_stop,Link.title, Link.description, media_name, media_creator, media_explanation, duration, url FROM (SELECT media_info.media_id FROM media_info UNION SELECT annotations.media_id FROM annotations UNION SELECT Link.media_id FROM Link ) AS tabkey LEFT JOIN annotations ON tabkey.media_id = annotations.media_id LEFT JOIN Link ON tabkey.media_id = Link.media_id LEFT JOIN media_info ON tabkey.media_id = media_info.media_id");
	while($row=mysql_fetch_array($sql)) 
	{ 
		$var=$var+1;		
		$media_id=$row['media_id'];
		$title=$row['title'];
		$ann_start=$row['ann_start'];
		$ann_stop=$row['ann_stop'];
		$ann_start=$row['link_start'];
		$ann_stop=$row['link_stop'];
		$description=$row['description']; 
		$media_name=$row['media_name'];
		$media_creator=$row['media_creator'];
		$duration=$row['duration'];
		$media_description=$row['media_explanation'];
		$annotations=$row['annotations'];
		$url=$row['url'];
		if($annotations=="" && $ann_start=="" && $ann_stop=="" && $title=="" && $description=="" && $url=="" && $link_start="" && $link_stop="")
			continue;
		else
		{
			if($annotations!=""&& $title=="" && $url=="")
			{			
			//echo "ajeet";
			$response[]=array("id"=>$media_id, "title"=>$title, "start"=>$ann_start, "stop"=>$ann_stop, "annotations"=>$annotations, "link_start"=>$link_start, "link_stop"=>$link_stop, "description"=>$description, "media_name"=>$media_name, "media_creator"=>$media_creator, "duration"=>$media_duration, "media_desc"=>$media_description, "url"=>$url, "table_name"=>"annotations");}
		}
		


		//$response[] = array('id'=> $titleId, 'media_id'=> $media_id, 'description'=>$description, 'title'=>$title, 'start'=>$start, 'stop'=>$stop, 'table_name'=>$table_name, 'url'=>$url);
	} 
	break;

}




$data=json_encode($response);

echo $_GET['jsoncallback'] . '(' . $data . ');';


?> 
