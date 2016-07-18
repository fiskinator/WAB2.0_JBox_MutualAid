define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/event",
    "dojo/dom",
    "dojo/_base/array",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/on",
    "dijit/Dialog",
    "dijit/form/Button"
],
  function (
    declare,
    lang,
    event,
    dom,
    array,
    domConstruct,
    domStyle,
    domAttr,
    on,
    Dialog,
    Button
  ) {
    return declare("", null, {

      constructor: function (slideShowClicked) {


            this.activeShow=slideShowClicked;


            // *********************************************************************************************
            // Slide show was adapted from this blog by JFisk 
            // http://themarklee.com/2013/12/26/simple-diy-responsive-slideshow-made-html5-css3-javascript/
            // Only create slideshow once the first time it is clicked
            // *********************************************************************************************
            var slideShowCont = dom.byId("slideShowContainerDivId");
                if(!slideShowCont){


                  // Creating centeredCapFormDivId to hold all DIV Content
                  var divParent = dom.byId("slideShowDiv");

                  // show slideShowDiv and hide viewer temporarily;


                  var newNode = domConstruct.create('div', 
                    {   className: "slideShowContainer",
                        id: "slideShowContainerDivId"
                    });
                  domConstruct.place(newNode, divParent, 'first');

                  content="";
                  //content+=   '<div id="slideShowHeaderId" class="slideShowHeader">'
                 //content+=       '<div class="icon-node jimu-float-trailing"><img src="jimu.js/images/group_icon.png" style="margin-top: 13px;"/></div>';
                 //content+=   '</div>';


                  content+=    '<div class="slideShowHeader">';
                  content+=       '<div class="horizontal-text-with-slideShow-icon" id="slideShowHeaderId"></div>';// Used for title of slide
                  content+=       '<div class="icon-cancel-circle-slideShowHeader" id=closeSlideShowId></div>';// <div class="horizontal-right-content" id="AddPartnerBtnId_EMACBtn">
                  content+=       '<div class="horizontal-cont-clear"></div>';
                  content+=    '</div>';



                  content+=   '<div class="diy-slideshow" id="diy-slideshow-DivId">';
                  content+=     '<span class="prev-slide" id="prevSlideId">&laquo;</span>';
                  content+=     '<span class="next-slide" id="nextSlideId">&raquo;</span>';
                  content+=   '</div>';



                  var newNode = domConstruct.toDom(content);
                      domConstruct.place(content, dom.byId("slideShowContainerDivId"), 'first');




                  var closeSlides = dom.byId("closeSlideShowId");

                      on(closeSlides, 'click', lang.hitch(this, function(close){
                        console.log('click-event-close-slides');
                        this.closeSlideShow(); //located in RES_AddRecordDialog;
                      }));


                  this.toggleVisibleSlideShow();

                } 

                // remove previous slides
                else{

                  document.getElementById("diy-slideshow-DivId").style.display = 'block';  // it is hidden when close box is clicked
                   
                  var getDIY = dom.byId("diy-slideshow-DivId")

                    while (getDIY.firstChild) {
                      getDIY.removeChild(getDIY.firstChild);
                    }


                          content="";
                          //content=  '<div class="diy-slideshow" id="diy-slideshow-DivId">';
                          content+=   '<span class="prev-slide" id="prevSlideId">&laquo;</span>';
                          content+=   '<span class="next-slide" id="nextSlideId">&raquo;</span>';
                          //content+='</div>';

                  
                  var newNode = domConstruct.toDom(content);

                    var getDIY2 = dom.byId("diy-slideshow-DivId")
                        getDIY2.appendChild(newNode)

                      //domConstruct.place(content, dom.byId("slideShowContainerDivId"), 'first'); 
                      //}
                  //document.getElementById("diy-slideshow-DivId").style.display = 'block';  
                }     

              
                //Get Image data from slideShow.json
                var slideArr = [];


                  dojo.xhrGet({
                      url: document.URL + "/widgets/MutualAid/mutualAid_configs/slideShow.json",
                      handleAs: "json",
                      load: lang.hitch(this, function(obj) {
                          /* here, obj will already be a JS object deserialized from the JSON response */

                                  slideArr=obj;

                                  var sArr = [];



                                  for (var i=0; i<slideArr.length; i++){

                                    if(slideArr[i].chapter==this.activeShow){    

                                        sArr.push({
                                          "pagetype": slideArr[i].pagetype,
                                          "chapter": slideArr[i].chapter,
                                          "title": slideArr[i].title,
                                          "subtitle": slideArr[i].subtitle,
                                          "bullet2": slideArr[i].bullet2,
                                          "bullet3": slideArr[i].bullet3,
                                          "listtype": slideArr[i].html_list_type_ul_ol,
                                          "slide": slideArr[i].slide,
                                          "link": slideArr[i].optional_link
                                        });

                                    }    
                                  }

                          lang.hitch(this,this.createSlideShowElements(sArr));

                      }),
                      error: function(err) {
                            /* this will execute if the response couldn't be converted to a JS object,
                            or if the request was unsuccessful altogether. */
                          console.log(err);
                      }
                  });

                //}// end if.  Only build this once.  Do not destroy it.




      },


      closeSlideShow: function(){


          var closeThis = dom.byId("slideShowContainerDivId");//JF Added
            if(closeThis){
                closeThis.remove();
            }

          this.toggleVisibleViewer();
      },

      // toggle visibilty of graphicsDIV, and Viewer Object
      toggleVisibleSlideShow: function(){

              var divParent = dom.byId("slideShowDiv");
                  divParent.style.display = 'block';

              var divViewer = dom.byId("main-page");
                  divViewer.style.display='none';    

      },

           // toggle visibilty of graphicsDIV, and Viewer Object
      toggleVisibleViewer: function(){
          // JF add class for visibility
              var divParent = dom.byId("slideShowDiv");
                  divParent.style.display='none';

              var divViewer = dom.byId("main-page");
                  divViewer.style.display='block';    

      }, 


      filterSlidesByChapter: function(sArr){


          // remove all child elements of diy-slideshow-DivId
          // add next and prev child elements

          // filter array by chapter.
          // chapter must have at least 1 element.  - check for array>0

          this.createSlideShowElements(filteredArr)

      },



      createSlideShowElements: function(sArr){

           


          var getHeight = document.getElementById("map_root").offsetHeight-50  + "px;";
          var getWidth = "width: " + document.getElementById("slideShowContainerDivId").offsetWidth + "px;";

          var openList_FirstItem=  "<" + sArr[0].listtype + ">";
          var closeList_FirstItem = "</" + sArr[0].listtype + ">";



          //document.getElementById("app_Title").innerHTML = sArr[0].title ;



          content="";

          if(sArr[0].pagetype=="website"){

                document.getElementById("slideShowHeaderId").innerHTML = sArr[0].title + ' (1' + ' of ' + sArr.length;// put title on the top bar header since video will be blockd
                content+='<figure class="show">'
                content+=   '<iframe id="slideId_0" frameborder="0" src="' + sArr[0].slide + '" width="100%" height="' + getHeight + '"></iframe>';
                content+=   '<figcaption>' + sArr[0].subtitle + '    ' + sArr[0].link + '</figcaption>'
                content+='</figure>'


          }
          else{
                // First item is set with class="show" to start the app
                document.getElementById("slideShowHeaderId").innerHTML = 'Slide 1' + ' of ' + sArr.length//sArr[itemToShow].title;
                content="";
                content+='<figure class="show">';
                content+=   '<img id="slideId_0" src="' + sArr[0].slide + '" width="100%"/>';
                content+=   '<figcaption>';

                // Title, subtitle, and all bullets in first slide
                if(sArr[0].bullet3.length>0){
                    content+='<div class="captionHeaderStyle">' +  sArr[0].title  + '</div>';
                    content+=     openList_FirstItem;
                    content+=       '<li>' + sArr[0].subtitle +'</li>';
                    content+=       '<li>' + sArr[0].bullet2 +'</li>';
                    content+=       '<li>' + sArr[0].bullet3 +'  ' + sArr[0].link; + '</li>';
                    content+=     closeList_FirstItem;
                }
                //Title, subtitle, bullet2 only
                if(sArr[0].bullet2.length>0 & sArr[0].bullet3.length<1){
                    content+='<div class="captionHeaderStyle">' +  sArr[0].title  + '</div>';
                    content+=     openList_FirstItem;
                    content+=       '<li>' + sArr[0].subtitle + '</li>';
                    content+=       '<li>' + sArr[0].bullet2 +  '  ' + sArr[0].link; + '</li>';
                    content+=     closeList_FirstItem;
                }
                // Title and subtitle only
                if(sArr[0].bullet2.length<1 & sArr[0].bullet3.length<1 & sArr[0].subtitle.length>1){
                    content+='<div class="captionHeaderStyle">' +  sArr[0].title  + '</div>';
                    content+=    '<li>' + sArr[0].subtitle + '    ' + sArr[0].link; + '</li>';

                }
                // Title only
                if(sArr[0].bullet2.length<1 & sArr[0].bullet3.length<1 & sArr[0].subtitle.length<1){
                    content+='<div class="captionHeaderStyle">' +  sArr[0].title  + ' ' + sArr[0].link; + '</div>';

                }



                content+=   '</figcaption>';
                content+='</figure>';
          }

          var newNode2 = domConstruct.toDom(content);
              domConstruct.place(newNode2, dom.byId("diy-slideshow-DivId"), 'last');


          for (var i=1; i<sArr.length; i++){


              // config requires using ol or ul
              var openList = "<" + sArr[i].listtype + ">";
              var closeList = "</" + sArr[i].listtype + ">";

              if(sArr[i].pagetype=="website"){

                content="";
                content+='<figure id="slideId_' + i + '">';
                content+=   '<iframe  frameborder="0" src="' + sArr[i].slide + '" width="99%" height="' + getHeight + '"></iframe>';
                content+=   '<figcaption>'


                //Bullets for 3 items
                if(sArr[i].bullet3!=""){
                    content+=     openList;
                    content+=       '<li>' + sArr[i].subtitle + '</li>';
                    content+=       '<li>' + sArr[i].bullet2 +  '</li>';
                    content+=       '<li>' + sArr[i].bullet3 +  ' ' + sArr[i].link; + '</li>';
                    content+=     closeList;
                    content+='</figcaption>';
                    content+='</figure>';   
                }

                                //Bullets for 3 items
                // Bullets for 2 items, since 3rd bullet is empty
                if(sArr[i].bullet2!="" & sArr[i].bullet3==""){
                    content+=     openList;
                    content+=       '<li>' + sArr[i].subtitle +  '</li>';
                    content+=       '<li>' + sArr[i].bullet2 +  ' ' + sArr[i].link; + '</li>';
                    content+=     closeList;
                    content+='</figcaption>';
                    content+='</figure>';   
                }

                // no bullets with single items
                if(sArr[i].bullet2=="" & sArr[i].bullet3==""){
                    content+=     openList;
                    content+=       sArr[i].subtitle +  ' ' + sArr[i].link;
                    content+=     closeList;
                    content+='</figcaption>';
                    content+='</figure>';  
                }



                var newNode2 = domConstruct.toDom(content);
                    domConstruct.place(newNode2, dom.byId("diy-slideshow-DivId"), 'last');
              }

              else{

//  Original, no-bullet code
//                content="";
//                content+='<figure>'
//                content+=   '<img id="slideId_' + i + '" src="' + sArr[i].slide + '" width="100%"/><figcaption id="figCapId_' + i +'">' + sArr[i].subtitle + '    ' + sArr[i].link + '</figcaption>';
//                content+='</figure>'




                content="";
                content+='<figure>';
                content+=   '<img id="slideId_' + i + '" src="' + sArr[i].slide + '" width="100%"/>';


                //Bullets for 3 items
                if(sArr[i].bullet3!=""){
                    content+='<figcaption>';

                    content+='<div class="captionHeaderStyle">' +  sArr[i].title  + '</div>';
                    content+=     openList;
                    content+=       '<li>' + sArr[i].subtitle + '</li>';
                    content+=       '<li>' + sArr[i].bullet2 +  '</li>';
                    content+=       '<li>' + sArr[i].bullet3 +  '    ' + sArr[i].link; + '</li>';
                    content+=     closeList;
                    content+='</figcaption>';
                    content+='</figure>';   
                }
                
                // Bullets for 2 items, since 3rd bullet is empty
                if(sArr[i].bullet2!="" & sArr[i].bullet3==""){
                    content+= '<figcaption>';
                    content+='<div class="captionHeaderStyle">' +  sArr[i].title  + '</div>';
                    content+=     openList;
                    content+=       '<li>' + sArr[i].subtitle + '</li>';
                    content+=       '<li>' + sArr[i].bullet2 +'  ' + sArr[i].link; + '</li>';
                    content+=     closeList;
                    content+='</figcaption>';
                    content+='</figure>';   
                }  

                // no bullets with single items
                if(sArr[i].bullet2=="" & sArr[i].bullet3=="" & sArr[i].subtitle!=""){
                    content+='<figcaption>';
                    content+='<div class="captionHeaderStyle">' +  sArr[i].title  + '</div>';
                    content+=      sArr[i].subtitle + '    ' + sArr[i].link; + '</li>';
                    content+='</figcaption>';
                    content+='</figure>';   

                }

                // Title Only
                if(sArr[i].bullet2=="" & sArr[i].bullet3=="" & sArr[i].subtitle==""){
                    content+='<figcaption>';
                    content+='<div class="captionHeaderStyle">' +  sArr[i].title  + ' ' + sArr[i].link; + '</div>';
                    content+='</figcaption>';
                    content+='</figure>';   

                }

              var newNode2 = domConstruct.toDom(content);
                  domConstruct.place(newNode2, dom.byId("diy-slideshow-DivId"), 'last');

              }// end check for slide type

          }

         this.initSlideShow(sArr);

      },

      initSlideShow: function (sArr) {

        var counter = 0, // to keep track of current slide
            $items = document.querySelectorAll('.diy-slideshow figure'), // a collection of all of the slides, caching for performance
            numItems = $items.length; // total number of slides

            // this function is what cycles the slides, showing the next or previous slide and hiding all the others
          var showCurrent = lang.hitch(this,function(sArr){

              var itemToShow = Math.abs(counter%numItems);// uses remainder (aka modulo) operator to get the actual index of the element to show  
  
              // remove .show from whichever element currently has it 
              // http://stackoverflow.com/a/16053538/2006057
              [].forEach.call( $items, lang.hitch(this,function(el){
                  el.classList.remove('show');
              }));
  



              // add .show to the one item that's supposed to have it
              $items[itemToShow].classList.add('show');


              for (var i=0; i<sArr.length; i++){

                  var showingDiv = "slideId_" + itemToShow;

                  if(i==itemToShow){// current slide showing

                      //place title in top Header
                      document.getElementById("slideShowHeaderId").innerHTML = 'Slide ' + (i+1) + ' of ' + sArr.length//sArr[itemToShow].title;
      // not in WAB
                      if(sArr[i].pagetype=="website"){
                        // place title on the video slides
                        document.getElementById("slideShowHeaderId").innerHTML = sArr[i].title + ' (' + (i+1) + ' of ' + sArr.length +')';
                        document.getElementById(showingDiv).style.zIndex = "1";

                      }




                  }
                  else{// all other slides

                      if(sArr[i].pagetype=="website"){
                        document.getElementById(showingDiv).style.zIndex = "-1";     
                        
                      }

                  }



              }



        });

        // add click events to prev & next buttons 
        document.querySelector('#nextSlideId').addEventListener('click', lang.hitch(this, function() {

            counter++;
            showCurrent(sArr);
        }), false);

        document.querySelector('#prevSlideId').addEventListener('click', lang.hitch(this,function() {

            counter--;
            showCurrent(sArr);
        }), false);


  
      },








    });
  });