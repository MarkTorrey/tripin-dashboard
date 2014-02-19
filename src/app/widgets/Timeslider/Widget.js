define([
        'dojo/text!./Widget.html',
        'dojo/_base/declare',
        'dijit/_WidgetsInTemplateMixin',

        'dojo/topic',
        'dojo/_base/lang',
        'dojo/_base/array',

        'jimu/BaseWidget',

        'esri/dijit/Legend',

        'esri/dijit/TimeSlider',
        'esri/TimeExtent'
    ],

    function(
        template, declare, _WidgetsInTemplateMixin, topic, lang, array,
        BaseWidget,
        Legend, TimeSlider, TimeExtent) {

        var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {

            //templateString: '<div data-dojo-attach-point="timesliderDiv">This is a very simple widget. <input type="button" value="Get Map Id" data-dojo-attach-event="click:_getMapId">.</div>',
            templateString: template,

            _getMapId: function() {
                alert(this.map.id);
            },

            startup: function() {
                this.inherited(arguments);

                console.log('ininting timeslider');
                this.timeSlider = new TimeSlider({
                        //style: 'width: 100%; height:100%'
                        style: 'width: 400px; height:100%'
                    },
                    this.timesliderContainer
                );

                this.timeSlider.setThumbCount(2);
                this.timeSlider.setThumbMovingRate(2000);

                var timeExtent = new TimeExtent();
                timeExtent.startTime = this.createDate(-7);
                timeExtent.endTime = this.createDate(7);
                this.setTimeRange(timeExtent);
                this.timeSlider.setThumbIndexes([0, this.timeSlider.timeStops.length]);

                this.timeSlider.on('time-extent-change', lang.hitch(this, function(e) {
                    var timeExtent = new TimeExtent();
                    timeExtent.startTime = e.startTime;
                    timeExtent.endTime = e.endTime;
                    this.map.setTimeExtent(timeExtent);
                    this.announceChange(timeExtent);
                }));

                // Hide play button
                //query('.tsPlayButton').closest('.dijitButton').style('display', 'none');

                this.timeSlider.startup();

            },

            onClose: function() {
            },

            setTimeRange: function(timeRange) {
                this.timeSlider.createTimeStopsByTimeInterval(timeRange, 1, 'esriTimeUnitsDays');
                //add labels for every other third time stop
                var labels = array.map(this.timeSlider.timeStops, function(timeStop, i) {
                    if (i % 7 === 0) {
                        return (timeStop.getMonth() + 1) + timeStop.getDate();
                    } else {
                        return '';
                    }
                });
                this.timeSlider.setLabels(labels);
            },

            announceChange: function(timeExtent) {
                topic.publish('TimeExtent/change', this, timeExtent);
            },

            createDate: function(offset) {
                var today = new Date();
                var aDate = new Date();
                aDate.setDate(today.getDate() + offset);
                return aDate;
            }

        });

        clazz.hasStyle = false;
        clazz.hasUIFile = false;
        clazz.hasLocale = false;
        clazz.hasConfig = false;
        return clazz;

    });