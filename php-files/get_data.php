<?php
//database_name :: NPTEl_data
//table name :: vp_nptel
//query for vid_id
//username:: root
//password :: ''
//##Initializations
//to store vid_id received from widget
$video_id=$_GET['video_id'];
//Make a database connection to localhost
$link = mysql_connect('localhost', 'root', '123');
if (!$link) {
    die('Could not connect: ' . mysql_error());
}


mysql_select_db("NPTEl_data") or die(mysql_error());

//query
$data = mysql_query("SELECT data FROM vp_nptel where vid_id='$video_id'")or die(mysql_error());
$info = mysql_fetch_array( $data );
$json_res = $info['data'];
echo $json_res;
//echo json_encode($info['data']);




//##operation
//2 Get vid_id from javascript.
//3 Make an sql query, get vid_id and the json structure
//4 curate - if necessary make changes in the data queried
//5 response - construct a response to be sent to js
//6 send the response to java script

//## clean it up
//close the database connection
mysql_close($link);


?>
