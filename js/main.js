$(function () {
  var pages_posts_count = 0;
  var pages_timeoutid;

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
    var post_id = parse_post_id($("#fb_id").val());

    if (post_id == null) {
      show_warning_message("輸入的網址或 id 有問題，請再次檢查確認！");
      $("#result").html("");
      $("#chart").html("");
      $("#lottery_result").hide();

      return false;
    }

    set_button_group_disabled(true);
    get_likes(post_id);
  });

  $("#comments").click(function () {
    var post_id = parse_post_id($("#fb_id").val());

    if (post_id == null) {
      show_warning_message("輸入的網址或 id 有問題，請再次檢查確認！");
      $("#result").html("");
      $("#chart").html("");
      $("#lottery_result").hide();

      return false;
    }

    set_button_group_disabled(true);
    get_comments(post_id);
  });

  $("#shares").click(function () {
    var post_id = parse_post_id($("#fb_id").val());

    if (post_id == null) {
      show_warning_message("輸入的網址或 id 有問題，請再次檢查確認！");
      $("#result").html("");
      $("#chart").html("");
      $("#lottery_result").hide();

      return false;
    }

    set_button_group_disabled(true);
    FB.getLoginStatus(function(response) {
      status_change_callback(response, post_id, get_shares);
    });
  });

  $("#articles").click(function () {
    set_button_group_disabled(true);
    FB.getLoginStatus(function(response) {
      status_change_callback(response, $("#fb_page_id").val(), get_posts);
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

  function status_change_callback(response, id, callback) {
    if (response.status === "connected") {
      callback(response.authResponse.accessToken, id);
    } else {
      FB.login(function(response){
        FB.getLoginStatus(function(response) {
          if (response.status === "connected") {
            callback(response.authResponse.accessToken, id);
          }
        });
      }, {scope: "read_stream"});
    }
  }

  function get_likes(fb_post_id) {
    $("#result").html("");
    $("#chart").html("");
    $("#lottery_result").hide();

    var api_url = "https://graph.facebook.com/" + fb_post_id + "/likes?limit=25";

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

          count = count + 1;
        });

        if (response_data.paging.next != null) {
          $("#result").html(result);
          $("#result").attr("data-count", count);
          get_likes_after(fb_post_id, gender, response_data.paging.cursors.after);
        } else {
          result += "</tbody>";
          $("#result").html(result);
          $("#result").attr("data-count", count);
          $("#result").show();
          show_success_message();
          set_button_group_disabled(false);
        }
      },
      error: function() {
        show_warning_message("讀取 Facebook 按讚 - 發生錯誤，請稍後再試，謝謝。");
        set_button_group_disabled(false);
      }
    });
  }

  function get_likes_after(fb_post_id, gender, after) {
     var api_url = "https://graph.facebook.com/" + fb_post_id + "/likes?limit=25&after=" + after;

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
          result += "<td><a href='https://www.facebook.com/" + user_obj.id + "' target='_blank'>" + user_obj.id + "</a></td>";
          result += "</tr>";

          count = count + 1;
        });

        if (response_data.paging.next != null) {
          $("#result").append(result);
          $("#result").attr("data-count", count);
          get_likes_after(fb_post_id, gender, response_data.paging.cursors.after);
        } else {
          result += "</tbody>";
          $("#result").append(result);
          $("#result").attr("data-count", count);
          $("#result").show();
          show_success_message();
          set_button_group_disabled(false);
        }
      },
      error: function() {
        show_warning_message("讀取 Facebook 按讚 - 發生錯誤，請稍後再試，謝謝。");
        set_button_group_disabled(false);
      }
    });
  }

  function get_comments(fb_post_id) {
    $("#result").html("");
    $("#chart").html("");
    $("#lottery_result").hide();

    var fb_post_id = $("#fb_id").val();
    var api_url = "https://graph.facebook.com/" + fb_post_id + "/comments?limit=25";

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

          count = count + 1;
        });

        if (response_data.paging.next != null) {
          $("#result").html(result);
          $("#result").attr("data-count", count);
          get_comments_after(fb_post_id, gender, response_data.paging.cursors.after);
        } else {
          result += "</tbody>";
          $("#result").html(result);
          $("#result").attr("data-count", count);
          show_success_message();
          set_button_group_disabled(false);
        }
      },
      error: function() {
        show_warning_message("讀取 Facebook 留言 - 發生錯誤，請稍後再試，謝謝。");
        set_button_group_disabled(false);
      }
    });
  }

  function get_comments_after(fb_post_id, gender, after) {
    var api_url = "https://graph.facebook.com/" + fb_post_id + "/comments?limit=25&after=" + after;

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
          result += "<td>" + user_obj.message + "</td>";
          result += "<td>" + user_obj.like_count + "</td>";
          result += "</tr>";

          count = count + 1;
        });

        if (response_data.paging.next != null) {
          $("#result").append(result);
          $("#result").attr("data-count", count);
          get_comments_after(fb_post_id, gender, response_data.paging.cursors.after);
        } else {
          result += "</tbody>";
          $("#result").append(result);
          $("#result").attr("data-count", count);
          show_success_message();
          set_button_group_disabled(false);
        }
      },
      error: function() {
        show_warning_message("讀取 Facebook 留言 - 發生錯誤，請稍後再試，謝謝。");
        set_button_group_disabled(false);
      }
    });
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
          set_button_group_disabled(false);
        }
      },
      error: function() {
        show_warning_message("讀取 Facebook 分享 - 發生錯誤，請稍後再試，謝謝。");
        set_button_group_disabled(false);
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
          set_button_group_disabled(false);
        }
      },
      error: function() {
        show_warning_message("讀取 Facebook 分享 - 發生錯誤，請稍後再試，謝謝。");
        set_button_group_disabled(false);
      }
    });
  }

  function get_posts(token, fb_page_id) {
    pages_posts_count = 0
    $("#result").html("");

    var days = 7
    var end_date = $.format.date(new Date(), "yyyy/MM/dd");
    var start_date = $.format.date(new Date(new Date().getTime() - days * 24 * 60 * 60 * 1000), "yyyy/MM/dd");

    var end_strtotime = Date.parse(end_date) / 1000;
    var start_strtotime = Date.parse(start_date) / 1000;

    var api_url = "https://graph.facebook.com/" + fb_page_id + "/posts?limit=25&until=" + end_date + "&since=" + start_date + "&access_token=" + token;
    var end;

    $.ajax({
      url: api_url,
      type: "GET",
      dataType: "json",
      success: function(response_data) {
        var result = "<thead><tr>";
        var count = 1;

        result += "<td class='article_td_1'>內容</td>"
        result += "<td class='article_td_2'>貼文種類</td>"
        result += "<td class='article_td_3'>按讚數</td>"
        result += "<td class='article_td_4'>留言數</td>"
        result += "<td class='article_td_5'>分享數</td>"
        result += "</tr></thead><tbody>";

        $.each(response_data.data, function (data, post_obj) {

          if (Date.parse($.format.date(post_obj.created_time, "yyyy/MM/dd")) / 1000 < start_strtotime) {
            end = true;
            return false;
          }

          if (post_obj.type != "status") {
            result += "<tr>"
            result += "<td class='tr_id_" + count + "' data-date='" + $.format.date(post_obj.created_time, "yyyy/MM/dd")
                   + "'><a href='https://www.facebook.com/" + post_obj.id.split("_")[0] + "/posts/" + post_obj.id.split("_")[1]
                   + "' target='_blank'>" + post_obj.message + "</a></td>"
            result += "<td class='tr_center tr_type_" + count + "'>" + post_obj.type + "</td>";
            result += "<td class='tr_center tr_likes_" + count + "'>" + 0 + "</td>";
            result += "<td class='tr_center tr_comments_" + count + "'>" + 0 + "</td>";
            result += "<td class='tr_center tr_shares_" + count + "'>" + 0 + "</td>";
            result += "</tr>";

            $(".tr_id_" + count).attr("data-id", $.format.date(post_obj.created_time, "yyyy/MM/dd"));

            if (post_obj.type == "photo") {
              get_post_summary_count(post_obj.object_id, "likes", token, ".tr_likes_" + count);
              get_post_summary_count(post_obj.object_id, "comments", token, ".tr_comments_" + count);
              get_post_summary_count(post_obj.object_id, "shares", token, ".tr_shares_" + count);
            } else {
              get_post_summary_count(post_obj.id.split("_")[1], "likes", token, ".tr_likes_" + count);
              get_post_summary_count(post_obj.id.split("_")[1], "comments", token, ".tr_comments_" + count);
              get_post_summary_count(post_obj.id, "shares", token, ".tr_shares_" + count);
            }

            count = count + 1;
          }
        });

        if (end != true) {
          $("#result").html(result);
          get_posts_after(token, response_data.paging.next, start_strtotime, count);
        } else {
          result += "</tbody>";
          $("#result").html(result);

          pages_timeoutid = setInterval(function() {
            if(count - 1 == pages_posts_count / 3){
              clearInterval(pages_timeoutid);
              article_summary(count);
              show_success_message();
              set_button_group_disabled(false);
            }
          }, 2000)
        }
      },
      error: function() {
        show_warning_message("讀取 Facebook 文章統計 - 發生錯誤，請稍後再試，謝謝。");
        set_button_group_disabled(false);
      }
    });
  }

  function get_posts_after(token, url, start_strtotime, count) {
    var api_url = url + "&access_token=" + token;

    $.ajax({
      url: api_url,
      type: "GET",
      dataType: "json",
      success: function(response_data) {
        var result = "";
        var end;

        $.each(response_data.data, function (data, post_obj) {

          if (Date.parse($.format.date(post_obj.created_time, "yyyy/MM/dd")) / 1000 < start_strtotime) {
            end = true;
            return false;
          }

          if (post_obj.type != "status") {
            result += "<tr>"
            result += "<td class='tr_id_" + count + "' data-date='" + $.format.date(post_obj.created_time, "yyyy/MM/dd")
                   + "'><a href='https://www.facebook.com/" + post_obj.id.split("_")[0] + "/posts/" + post_obj.id.split("_")[1]
                   + "' target='_blank'>" + post_obj.message + "</a></td>"
            result += "<td class='tr_center tr_type_" + count + "'>" + post_obj.type + "</td>";
            result += "<td class='tr_center tr_likes_" + count + "'>" + 0 + "</td>";
            result += "<td class='tr_center tr_comments_" + count + "'>" + 0 + "</td>";
            result += "<td class='tr_center tr_shares_" + count + "'>" + 0 + "</td>";
            result += "</tr>";



            if (post_obj.type == "photo") {
              get_post_summary_count(post_obj.object_id, "likes", token, ".tr_likes_" + count);
              get_post_summary_count(post_obj.object_id, "comments", token, ".tr_comments_" + count);
              get_post_summary_count(post_obj.object_id, "shares", token, ".tr_shares_" + count);
            } else {
              get_post_summary_count(post_obj.id.split("_")[1], "likes", token, ".tr_likes_" + count);
              get_post_summary_count(post_obj.id.split("_")[1], "comments", token, ".tr_comments_" + count);
              get_post_summary_count(post_obj.id, "shares", token, ".tr_shares_" + count);
            }

            count = count + 1;
          }
        });

        if (end != true) {
          $("#result > tbody").append(result);
          get_posts_after(token, response_data.paging.next, start_strtotime, count);
        } else {
          result += "</tbody>";
          $("#result > tbody").append(result);

          pages_timeoutid = setInterval(function() {
            if(count - 1 == pages_posts_count / 3){
              clearInterval(pages_timeoutid);
              article_summary(count);
              show_success_message();
              set_button_group_disabled(false);
            }
          }, 2000)
        }
      },
      error: function() {
        show_warning_message("讀取 Facebook 文章統計 - 發生錯誤，請稍後再試，謝謝。");
        set_button_group_disabled(false);
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

  function get_post_summary_count(fb_post_id, type, token, classname) {
    var api_url;

    if (type == "likes" || type == "comments") {
      api_url = "https://graph.facebook.com/" + fb_post_id + "/" + type + "?summary=true&access_token=" + token;
    } else if (type == "shares") {
      api_url = "https://graph.facebook.com/" + fb_post_id + "?access_token=" + token;
    }

    $.ajax({
      url: api_url,
      type: "GET",
      dataType: "json",
      success: function(response_data) {
        if (type == "likes" || type == "comments") {
          $(classname).text(response_data.summary.total_count);
        } else if (type == "shares") {
          if (response_data.hasOwnProperty("shares")) {
            $(classname).text(response_data.shares.count);
          } else {
            $(classname).text(0);
          }
        }
        pages_posts_count += 1;
      },
      error: function() {
        show_warning_message("讀取 Facebook 文章按讚數 - 發生錯誤，請稍後再試，謝謝。");
      }
    });
  }

  function article_summary(count) {
    var x_category = new Array();
    var data_likes = [0, 0, 0, 0, 0, 0, 0];
    var data_comments = [0, 0, 0, 0, 0, 0, 0];
    var data_shares = [0, 0, 0, 0, 0, 0, 0];

    $.each([7, 6, 5, 4, 3, 2, 1], function(index, value) {
      x_category.push($.format.date(new Date(new Date().getTime() - value * 24 * 60 * 60 * 1000), "yyyy/MM/dd"));
    });

    for ( var i = 1; i < count; i++ ) {
      var date = $(".tr_id_" + i).attr("data-date");
      var likes = parseInt($(".tr_likes_" + i).text());
      var comments = parseInt($(".tr_comments_" + i).text());
      var shares = parseInt($(".tr_shares_" + i).text());
      var index = $.inArray(date, x_category)

      data_likes[index] += likes;
      data_comments[index] += comments;
      data_shares[index] += shares;
    }

    data_likes.unshift("按讚數");
    data_comments.unshift("留言數");
    data_shares.unshift("分享數");

    var chart = get_bar_chart([data_likes, data_comments, data_shares], x_category);
  }

  function count_element(item, array) {
    var count = 0;
    $.each(array, function(i,v) { if (v === item) count++; });
    return count;
  }

  function get_pie_chart(data) {
    return c3.generate({
      data: {
        columns: data,
        type : 'pie',
        colors: {
          "male": "#017CDC",
          "female": "#009F5D",
          "not set": "#F8BD0D"
        }
      }
    });
  }

  function get_bar_chart(data, x_category) {
    return c3.generate({
      data: {
        columns: data,
        type : 'bar',
        colors: {
          "male": "#017CDC",
          "female": "#009F5D",
          "not set": "#F8BD0D"
        }
      },
      axis: {
        x: {
          type: "category",
          categories: x_category
        }
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

  function set_button_group_disabled(boolean_value) {
    $("#likes").attr('disabled', boolean_value);
    $("#comments").attr('disabled', boolean_value);
    $("#shares").attr('disabled', boolean_value);
    $("#export_csv").attr('disabled', boolean_value);
    $("#lottery").attr('disabled', boolean_value);
    $("#export_lottery_csv").attr('disabled', boolean_value);
    $("#articles").attr('disabled', boolean_value);
  }

  function parse_post_id(url) {
    if (url.indexOf("/photos/") > -1) {
      var temp = url.match("/[0-9]+/");

      if (temp != null) {
        return temp[0].match("[0-9]+")[0];
      }
    } else if (url.indexOf("/posts/") > -1) {
      var temp = url.match("[0-9]+");

      if (temp != null) {
        return temp[0];
      }
    } else {
      if (isNaN(parseInt(url)) == false) {
        return url;
      }
    }
  }
});
