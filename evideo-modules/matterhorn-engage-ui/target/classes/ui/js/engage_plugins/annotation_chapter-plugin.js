/**
 *  Copyright 2009-2011 The Regents of the University of California
 *  Licensed under the Educational Community License, Version 2.0
 *  (the "License"); you may not use this file except in compliance
 *  with the License. You may obtain a copy of the License at
 *
 *  http://www.osedu.org/licenses/ECL-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an "AS IS"
 *  BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 *  or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 *
 */
 
var Opencast = Opencast || {};

/**
 * @namespace the global Opencast namespace Annotation_ChapterPlugin
 */
Opencast.Annotation_ChapterPlugin = (function ()
{
	var mediaPackageId = Opencast.Utils.getURLParameter('id');
    //place to render the data in the html
    var template = '<table ' + 'width=450' + ' style="border-style:solid; border-width:1.5px;"' +'id="annotation_holder" >' + '<tr><td align=center style=" font-size:30; border-style:solid; background-color:#FFF5EE; border-width:1.5px; font-weight:bold" >ANNOTATIONS</td></tr>' +
                      '<tr><td style="border-style:none;" ><select size=15 style="width:450px; background-color:#98AFC7;font-weight:bold; font-size:20; " >'+
                           
                             '{for a in annotation}' +
				'{if ( Opencast.Utils.getURLParameter(\'id\') == a.mediapackageId )}' +	
                                   '<option style="font-size:30; font-weight:bold; "'+ 
                                     'id="segment${a.annotationId}"' +
                                     'onclick="Opencast.Watch.seekSegment(${parseInt(a.inpoint) / 1000})" ' +
                                     'alt="Slide ${parseInt(a.index) + 1} of ${annotation.length}" ' +
                                     'onmouseover=""'+
					
                                     '>' +
                                          '${a.value}' + 
                                   '</option>' +
				'{/if}' +
                                 '{/for}' +   '</select></td></tr>'+
                            
                        
                    '</table>';
                    
    // The Element to put the div into
    var element;
    // Data to process
    var annotation_chapterData;
    // Processed Data
    var processedTemplateData;
    
    /**
     * @memberOf Opencast.Annotation_ChapterPlugin
     * @description Add As Plug-in
     * @param elem Element to put the Data into
     * @param data The Data to process
     * @return true if successfully processed, false else
     */
    function addAsPlugin(elem, data)
    {
        element = elem;
        annotation_chapterData = data;
        return drawAnnotation_Chapter();
    }

    
    /**
     * @memberOf Opencast.Annotation_ChapterPlugin
     * @description Resize Plug-in
     * @return true if successfully processed, false else
     */
    function resizePlugin()
    {
        return drawAnnotation_Chapter();
    }
    
    /**
     * @memberOf Opencast.Annotation_ChapterPlugin
     * @description Add annotations into template element
     * processing the template with service data
     * @return true if successfully processed, false else
     */
    function drawAnnotation_Chapter()
    {
        if ((element !== undefined) &&
            (annotation_chapterData.annotation !== undefined) &&
            (annotation_chapterData.annotation.length > 0) &&
            (annotation_chapterData.duration > 0))
        {
            Opencast.Utils.log("Annotation Plugin: Data available, processing template");
            processedTemplateData = template.process(annotation_chapterData);
            element.html(processedTemplateData);
            return true;
        }
        else
        {
            Opencast.Utils.log("Annotation Plugin: No data available");
            return false;
        }
    }
    
    return {
        addAsPlugin: addAsPlugin,
        resizePlugin: resizePlugin
    };
}());
