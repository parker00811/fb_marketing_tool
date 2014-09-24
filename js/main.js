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
    $("#chart").html("");
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

        var gender = new Array();
        var count = 1;

        $.each(response_data.data, function (data, user_obj) {
          result += "<tr class='tr_" + count.toString() + "'>"
          result += "<td>" + count.toString() + "</td>";
          result += "<td><a href='https://www.facebook.com/" + user_obj.id + "' target='_blank'>" + user_obj.id + "</a></td>";
          result += "</tr>";

          get_gender(user_obj.id, function(user_gender){
            gender.push(user_gender);

            if (gender.length == count - 1) {
              var male = ["male", count_element("male", gender)];
              var female = ["female", count_element("female", gender)];
              var not_set = ["not set", count_element("not set", gender)];
              pie_chart_data = [male, female, not_set];
              get_pie_chart(pie_chart_data);
            }
          });

          count = count + 1;
        });

        result += "</tbody>";

        $("#result").html(result);
        $("#result").attr("data-count", count);
        $("#result").show();
        show_success_message();
      },
      error: function() {
        show_warning_message("讀取 Facebook 按讚 - 發生錯誤，請稍後再試，謝謝。");
      }
    });
  });

  $("#comments").click(function () {
    $("#result").html("");
    $("#chart").html("");
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

        var gender = new Array();
        var count = 1;

        $.each(response_data.data, function (data, user_obj) {
          result += "<tr class='tr_" + count.toString() + "'>"
          result += "<td>" + count.toString() + "</td>";
          result += "<td><a href='https://www.facebook.com/" + user_obj.from.id + "' target='_blank'>" + user_obj.from.id + "</a></td>";
          result += "<td>" + user_obj.message + "</td>";
          result += "<td>" + user_obj.like_count + "</td>";
          result += "</tr>";

          get_gender(user_obj.from.id, function(user_gender){
            gender.push(user_gender);

            if (gender.length == count - 1) {
              var male = ["male", count_element("male", gender)];
              var female = ["female", count_element("female", gender)];
              var not_set = ["not set", count_element("not set", gender)];
              pie_chart_data = [male, female, not_set];
              get_pie_chart(pie_chart_data);
            }
          });

          count = count + 1;
        });

        result += "</tbody>";

        $("#result").html(result);
        $("#result").attr("data-count", count);

        show_success_message();
      },
      error: function() {
        show_warning_message("讀取 Facebook 留言 - 發生錯誤，請稍後再試，謝謝。");
      }
    });
  });

  $("#shares").click(function () {
    FB.getLoginStatus(function(response) {
        var token = status_change_callback(response);
        if (token != null) {
          var fb_post_id = $("#fb_id").val();
          get_shares(token, fb_post_id);
        }
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
      var random_number = random_int_from_interval(1, pepole_count - 1)
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
            return response.authResponse.accessToken;
          }
        });
      }, {scope: "read_stream"});
    }
  }

  function get_shares(token, fb_post_id) {
    $("#chart").html("");
    $("#result").html("");
    $("#lottery_result").hide();

    var api_url = "https://graph.facebook.com/" + fb_post_id + "/sharedposts?limit=25&access_token=" + token;

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
          result += "<td><a href='https://www.facebook.com/" + user_obj.from.id + "' target='_blank'>" + user_obj.from.id + "</a></td>";
          result += "</tr>";

          count = count + 1;
        });

        if (response_data.paging.next != null) {
          $("#result").html(result);
          $("#result").attr("data-count", count);
          get_shares_after(token, fb_post_id, response_data.paging.cursors.after);
        } else {
          result += "</tbody>";
          $("#result").html(result);
          $("#result").attr("data-count", count);
          show_success_message();
        }
      },
      error: function() {
        show_warning_message("讀取 Facebook 分享 - 發生錯誤，請稍後再試，謝謝。");
      }
    });
  }

  function get_shares_after(token, fb_post_id, after) {
    var api_url = "https://graph.facebook.com/" + fb_post_id + "/sharedposts?limit=25&access_token=" + token + "&after=" + after;

    $.ajax({
      url: api_url,
      type: "GET",
      dataType: "json",
      success: function(response_data) {
        var result;

        var count = parseInt($("#result").attr("data-count"));

        $.each(response_data.data, function (data, user_obj) {
          result += "<tr class='tr_" + count.toString() + "'>"
          result += "<td>" + count.toString() + "</td>";
          result += "<td><a href='https://www.facebook.com/" + user_obj.from.id + "' target='_blank'>" + user_obj.from.id + "</a></td>";
          result += "</tr>";

          count = count + 1;
        });

        if (response_data.paging.next != null) {
          $("#result > tbody").append(result);
          $("#result").attr("data-count", count);
          get_shares_after(token, fb_post_id, response_data.paging.cursors.after);
        } else {
          result += "</tbody>";
          $("#result > tbody").append(result);
          $("#result").attr("data-count", count);
          show_success_message();
        }
      },
      error: function() {
        show_warning_message("讀取 Facebook 分享 - 發生錯誤，請稍後再試，謝謝。");
      }
    });
  }

  function get_gender(fb_id, callback) {
    var api_url = "https://graph.facebook.com/" + fb_id;

    $.ajax({
      url: api_url,
      type: "GET",
      dataType: "json",
      success: function(response_data) {
        var user_gender = "";
        if (response_data.hasOwnProperty("gender")) {
          user_gender = response_data.gender;
        } else {
          user_gender = "not set";
        }

        if(typeof callback === "function") callback(user_gender);
      },
      error: function() {
        show_warning_message("讀取 Facebook 性別 - 發生錯誤，請稍後再試，謝謝。");
      }
    });
  }

  function count_element(item, array) {
    var count = 0;
    $.each(array, function(i,v) { if (v === item) count++; });
    return count;
  }

  function get_pie_chart(data) {
    var chart = c3.generate({
    data: {
      columns: data,
      type : 'pie',
      colors: {
        "male": "#017CDC",
        "female": "#009F5D",
        "not set": "#F8BD0D"
      },
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
