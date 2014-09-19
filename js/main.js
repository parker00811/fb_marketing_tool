$(function () {
  window.fbAsyncInit = function() {
    FB.init({
      appId      : '794463723939962',
      xfbml      : true,
      version    : 'v2.1'
    });
  };

  // Load the SDK asynchronously
  (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
   }(document, 'script', 'facebook-jssdk'));

  $("#likes").click(function () {
    $("#result").html("");
    $("#lottery_result").hide();

    var fb_post_id = $("#fb_id").val();
    var api_url = "https://graph.facebook.com/" + fb_post_id + "/likes";

    $.ajax({
      url: api_url,
      type: "GET",
      dataType: "json",
      success: function(response_data) {
        var result = "<thead><tr>";
        result += "<td class='like_td_1'>序號</td>"
        result += "<td class='like_td_2'>facebook id</td>"
        result += "</tr></thead><tbody>";

        var count = 1;

        $.each(response_data.data, function (data, user_obj) {
          result += "<tr class='tr_" + count.toString() + "'>"
          result += "<td>" + count.toString() + "</td>";
          result += "<td>" + user_obj.id + "</td>";
          result += "</tr>";

          count = count + 1;
        });

        result += "</tbody>";

        $("#result").html(result);
        $("#result").attr("data-count", count);
        $("#result").show();
        show_success_message();
      },
      error: function() {
        show_warning_message("讀取 Facebook 發生錯誤，請稍後再試，謝謝。");
      }
    });
  });

  $("#comments").click(function () {
    $("#result").html("");
    $("#lottery_result").hide();

    var fb_post_id = $("#fb_id").val();
    var api_url = "https://graph.facebook.com/" + fb_post_id + "/comments";

    $.ajax({
      url: api_url,
      type: "GET",
      dataType: "json",
      success: function(response_data) {
        var result = "<thead><tr>";
        result += "<td class='comment_td_1'>序號</th>"
        result += "<td class='comment_td_2'>facebook id</td>"
        result += "<td class='comment_td_3'>留言內容</td>"
        result += "<td class='comment_td_4'>按讚數</td>"
        result += "</tr></thead><tbody>";

        var count = 1;

        $.each(response_data.data, function (data, user_obj) {
          result += "<tr class='tr_" + count.toString() + "'>"
          result += "<td>" + count.toString() + "</td>";
          result += "<td>" + user_obj.from.id + "</td>";
          result += "<td>" + user_obj.message + "</td>";
          result += "<td>" + user_obj.like_count + "</td>";
          result += "</tr>";

          count = count + 1;
        });

        result += "</tbody>";

        $("#result").html(result);
        $("#result").attr("data-count", count);

        show_success_message();
      },
      error: function() {
        show_warning_message("讀取 Facebook 發生錯誤，請稍後再試，謝謝。");
      }
    });
  });

  $("#shares").click(function () {
    FB.getLoginStatus(function(response) {
        status_change_callback(response);
    });
  });


  $("#export_csv").click(function () {
    $("#result").tableExport({ type: "csv", escape: "false", ignoreColumn:"[2, 3]" });
  });

  $("#export_lottery_csv").click(function () {
    $("#lottery_result").tableExport({ type: "csv", escape: "false", ignoreColumn:"[2, 3]" });
  });

  $("#lottery").click(function (event) {
    $("#lottery_result > thead").html("");
    $("#lottery_result > tbody").html("");

    var item_count = $("#item_count").val();
    var pepole_count = $("#result").attr("data-count");

    if (pepole_count == 0) {
      show_warning_message("請先利用「抓按讚」、「抓留言」與「抓分享」抓取抽獎清單，才可以開始抽獎，謝謝。");
      $("#lottery_result").hide();
      event.preventDefault();
      event.stopPropagation();
      return false;
    }

    if (item_count >= pepole_count - 1) {
      show_warning_message("獎品大於等於人數，所以全中不用抽獎");
      $("#lottery_result").hide();
      event.preventDefault();
      event.stopPropagation();
      return false;
    }

    var lottery_list = get_lottery_list(item_count, pepole_count);
    $("#lottery_result > thead:last").append($("#result > thead > tr").clone());

    $.each(lottery_list, function(index, value) {
      var row = $(".tr_" + value.toString()).clone();
      $("#lottery_result > tbody:last").append(row);
    });

    $("#lottery_result").show();
  });

  function random_int_from_interval(min, max){
    return Math.floor(Math.random()*(max-min+1)+min);
  }

  function get_lottery_list(item_count, pepole_count){
    lottery_list = new Array();
    var i = 0;
    while (i < item_count){
      var random_number = random_int_from_interval(1, pepole_count)
      if ($.inArray(random_number, lottery_list) == -1) {
        lottery_list.push(random_number);
        i = i + 1;
      }
    }
    return lottery_list;
  }

  function status_change_callback(response) {
    if (response.status === "connected") {
      var token = response.authResponse.accessToken;
      var fb_post_id = $("#fb_id").val();
      get_shares(token, fb_post_id);
    } else {
      FB.login(function(response){
        FB.getLoginStatus(function(response) {
          if (response.status === "connected") {
            var token = response.authResponse.accessToken;
            var fb_post_id = $("#fb_id").val();
            get_shares(token, fb_post_id);
          }
        });
      }, {scope: "read_stream"});
    }
  }

  function get_shares(token, fb_post_id) {
    $("#result").html("");
    $("#lottery_result").hide();

    var api_url = "https://graph.facebook.com/" + fb_post_id + "/sharedposts?access_token=" + token;

    $.ajax({
      url: api_url,
      type: "GET",
      dataType: "json",
      success: function(response_data) {
        var result = "<thead><tr>";
        result += "<td class='share_td_1'>序號</th>"
        result += "<td class='share_td_2'>facebook id</td>"
        result += "</tr></thead><tbody>";

        var count = 1;

        $.each(response_data.data, function (data, user_obj) {
          result += "<tr class='tr_" + count.toString() + "'>"
          result += "<td>" + count.toString() + "</td>";
          result += "<td>" + user_obj.from.id + "</td>";
          result += "</tr>";

          count = count + 1;
        });

        result += "</tbody>";

        $("#result").html(result);
        $("#result").attr("data-count", count);

        show_success_message();
      },
      error: function() {
        show_warning_message("讀取 Facebook 發生錯誤，請稍後再試，謝謝。");
      }
    });
  }

  function show_success_message(message){
    var alertmessage = message == undefined ? "處理完成..." : message;
    var notification = $("#success-notification")
    show_notification(notification, alertmessage);

  }

  function show_warning_message(message) {
    var alertmessage = message == undefined ? "發生錯誤，請稍後再試..." : message;
    var notification = $("#warning-notification")
    show_notification(notification, alertmessage);
  }

  function show_notification(notification_obj, message) {
    notification_obj.html(message);
    notification_obj.show("slow");
    setTimeout(function(){ notification_obj.hide("slow"); }, 3000);
  }
});
