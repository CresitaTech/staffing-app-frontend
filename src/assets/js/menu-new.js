!function (a) {
    jQuery.fn[a] = function (e) {
        return e ? this.on("resize", (t = e, function () {
            var e = this, a = arguments;
            i ? clearTimeout(i) : n && t.apply(e, a), i = setTimeout(function () {
                n || t.apply(e, a), i = null
            }, o || 100)
        })) : this.trigger(a);
        var t, o, n, i
    }
}((jQuery, "smartresize"));

var CURRENT_URL = window.location.href.split("#")[0].split("?")[0],
    $BODY = $("body"),
    $MENU_TOGGLE = $("#menu_toggle"),
    $SIDEBAR_MENU = $("#sidebar-menu"),
    $SIDEBAR_FOOTER = $(".sidebar-footer"),
    $LEFT_COL = $(".left_col"),
    $RIGHT_COL = $(".right_col"),
    $NAV_MENU = $(".nav_menu"),
    $FOOTER = $("footer");

$(function () {
    
    $(document).on("click",function(event) { 
        var $target = $(event.target);
       // console.log($target);
        if(!$target.closest('#sidebar-menu').length && 
        $SIDEBAR_MENU.is(":visible")) {
      //  $SIDEBAR_MENU.find("li.active-sm ").removeClass("li.active-sm")
        $SIDEBAR_MENU.find("li.active ul").hide();
        $SIDEBAR_MENU.find(".main-li").removeClass("active")
        $SIDEBAR_MENU.find("li").removeClass("active")
        }    
      });

      $SIDEBAR_MENU.on("click", '.child_menu', function (e) {
    //    $SIDEBAR_MENU.find("li.active-sm").removeClass("li.active-sm")
        $SIDEBAR_MENU.find("li.active ul").hide();
        $SIDEBAR_MENU.find(".main-li").removeClass("active")
        $SIDEBAR_MENU.find("li").removeClass("active")

        
    })

    function t() {
        $RIGHT_COL.css("min-height", $(window).height());
        var e = $BODY.outerHeight(), a = $BODY.hasClass("footer_fixed") ? -10 : $FOOTER.height(),
            t = $LEFT_COL.eq(1).height() + $SIDEBAR_FOOTER.height(), o = e < t ? t : e; o -= $NAV_MENU.height() + a, $RIGHT_COL.css("min-height", o)
    }
    function o() {
        $SIDEBAR_MENU.find("li").removeClass("active active-sm"), $SIDEBAR_MENU.find("li ul").slideUp()
    }


   

    $SIDEBAR_MENU.on("click", '.main-li', function (e) {
      //  console.log('link clicked');
         var a = $(this).parent();
        // if(a.children('ul').length > 0){
        //     var child_ul = a.children('ul')[0];
        //     $(child_ul).hasClass('show')
        //         ? $(child_ul).slideUp(function () { t() })
        //         : $(child_ul).slideDown(function () { t() });
        //     $(child_ul).on('click', function(){
        //         $(this).slideUp(function () { t() }).removeClass('show')
        //     });
        // } else {
        //     o(), a.addClass("active")
        // }


      // console.log(a);
        a.is(".active")
            ? (a.removeClass("active active-sm"), $("ul:first", a).slideUp(function () { t() }))
            : (a.parent().is(".child_menu")
                ? $BODY.is("nav-sm") && (a.parent().is("child_menu") || o())
                : o(), a.addClass("active"), $("ul:first", a).slideDown(function () { t() }))
    }), $MENU_TOGGLE.on("click", function () {
       // console.log('burger icon clicked');
        $BODY.hasClass("nav-md")
            ? ($SIDEBAR_MENU.find("li.active ul").hide(), $SIDEBAR_MENU.find("li.active").addClass("active-sm").removeClass("active"))
            : ($SIDEBAR_MENU.find("li.active-sm ul").show(),
                $SIDEBAR_MENU.find("li.active-sm").addClass("active").removeClass("active-sm")),
            $BODY.toggleClass("nav-md nav-sm"),
            t()
            ,
            $(".dataTable").each(function () {$(this).dataTable().fnDraw()})
    }), $SIDEBAR_MENU.find('a[href="' + CURRENT_URL + '"]').parent("li").addClass("current-page"),
        $SIDEBAR_MENU.find("a").filter(function () {
            return this.href == CURRENT_URL
        }).parent("li")
            .addClass("current-page")
            .parents("ul")
            .slideDown(function () { t() })
            .parent()
            .addClass("active"),
        $(window).smartresize(function () { t() }),
        t(),
        $.fn.mCustomScrollbar && $(".menu_fixed").mCustomScrollbar({
            autoHideScrollbar: !0, theme: "minimal", mouseWheel: { preventDefault: !0 }
        })
});


// !function (a) {
//     jQuery.fn[a] = function (e) {
//         return e ? this.on("resize", (t = e, function () {
//             var e = this, a = arguments;
//             i ? clearTimeout(i) : n && t.apply(e, a), i = setTimeout(function () {
//                 n || t.apply(e, a), i = null
//             }, o || 100)
//         })) : this.trigger(a);
//         var t, o, n, i
//     }
// }((jQuery, "smartresize"));

// var CURRENT_URL = window.location.href.split("#")[0].split("?")[0],
//     $BODY = $("body"),
//     $MENU_TOGGLE = $("#menu_toggle"),
//     $SIDEBAR_MENU = $("#sidebar-menu"),
//     $SIDEBAR_FOOTER = $(".sidebar-footer"),
//     $LEFT_COL = $(".left_col"),
//     $RIGHT_COL = $(".right_col"),
//     $NAV_MENU = $(".nav_menu"),
//     $FOOTER = $("footer");

// $(function () {
//     console.log('init called');

//     function t() {
//         $RIGHT_COL.css("min-height", $(window).height());
//         var e = $BODY.outerHeight(), a = $BODY.hasClass("footer_fixed") ? -10 : $FOOTER.height(),
//             t = $LEFT_COL.eq(1).height() + $SIDEBAR_FOOTER.height(), o = e < t ? t : e; o -= $NAV_MENU.height() + a, $RIGHT_COL.css("min-height", o)
//     }
//     function o() {
//         $SIDEBAR_MENU.find("li").removeClass("active active-sm"), $SIDEBAR_MENU.find("li ul").slideUp()
//     }
//     $SIDEBAR_MENU.on("click", '.main-li', function (e) {
//         var a = $(this).parent();
//         if(a.children('ul').length > 0){
//             var child_ul = a.children('ul')[0];
//             $(child_ul).hasClass('show')
//                 ? $(child_ul).slideUp(function () { t() })
//                 : $(child_ul).slideDown(function () { t() });
//             $(child_ul).on('click', function(){
//                 $(this).slideUp(function () { t() }).removeClass('show')
//             });
//         } else {
//             o(), a.addClass("active")
//         }
//     }), $MENU_TOGGLE.on("click", function () {
//         console.log('burger icon clicked');
//         $BODY.hasClass("nav-md")
//             ? ($SIDEBAR_MENU.find("li.active ul").hide(), $SIDEBAR_MENU.find("li.active").addClass("active-sm").removeClass("active"))
//             : ($SIDEBAR_MENU.find("li.active-sm ul").show(),
//                 $SIDEBAR_MENU.find("li.active-sm").addClass("active").removeClass("active-sm")),
//             $BODY.toggleClass("nav-md nav-sm"),
//             t()
//             // ,
//             // $(".dataTable").each(function () {$(this).dataTable().fnDraw()})
//     }), $SIDEBAR_MENU.find('a[href="' + CURRENT_URL + '"]').parent("li").addClass("current-page"),
//         $SIDEBAR_MENU.find("a").filter(function () {
//             return this.href == CURRENT_URL
//         }).parent("li")
//             .addClass("current-page")
//             .parents("ul")
//             .slideDown(function () { t() })
//             .parent()
//             .addClass("active"),
//         $(window).smartresize(function () { t() }),
//         t(),
//         $.fn.mCustomScrollbar && $(".menu_fixed").mCustomScrollbar({
//             autoHideScrollbar: !0, theme: "minimal", mouseWheel: { preventDefault: !0 }
//         })
// });