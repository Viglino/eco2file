/**
 * Handle menu and pages
 */
import './menu.css'
import html from './menu.html'
import aboutHtml from '../pages/about.html'
import uploadHtml from '../pages/upload.html'
import downloadHtml from '../pages/download.html'

// Menu content
const menu = $('<div>').attr('id', 'menu')
  .html(html)
  .appendTo('body');

// Back
$('.back', menu).click(function(){
  $(".menu",menu).hide();
});

// Pages
$('.page.about', menu).append($('<div>').html(aboutHtml));
$('.page.upload', menu).append($('<div>').html(uploadHtml));
$('.page.download', menu).append($('<div>').html(downloadHtml));

$('.page', menu).each(function() {
  $('<i>').html('&#10096;')
    .click(() =>{
      $('.page', menu).removeClass('active');
    })
    .prependTo(this)
});

/** Show Page
 */
function showPage(page) {
  if (page) $('.page.'+page, menu).addClass('active');
}

/** Show page on menu */
$('.menu li', menu).click(function(){
  const page = $(this).data('page');
  showPage(page);
});

// Menu
menu.click(() => {
  $(".menu",menu).hide();
});
/*
// Search menu
$('li.searchAdress', menu).click(()=>{
  search.searchAdress();
});
*/

// Menu bars
$('<i class="fa fa-bars">')
  .click(()=>{
    $("> *", menu).show();
  })
  .prependTo('#header');

export default { 
  show: showPage,
  hide: function() {
    $('.page', menu).removeClass('active');
  }
};