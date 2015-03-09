"use strict";

/********
 * Views
 ********/

var Views = (function() {
    var viewStruct = {};
    var body =   {};
    var swiper = {};
    var template = '';
    var defaultMainClass = '';
    var init = function() {
        swiper = new Swiper('.swiper-container', {
            // general settings
            hashNav: false,
            keyboardControl: true,
            calculateHeight: true,
            // pagination settings
            //loop: true,
            pagination: '.pagination',
            paginationClickable: true,
            createPagination: true,
            onSlideChangeStart: function(e){
                body.update(viewStruct);
                RoadMap.initCircle(Geolocation.getPosition());
                var station_detail = $('.swiper-slide-active')[0].firstChild.childNodes[0].nodeValue.split(' ',2);

                var active_station = Stations.getStationDetails(station_detail[1]); // get details from the active slide
                RoadMap.addMarker(Geolocation.getPosition(), active_station, viewStruct.view);
            }
        });
    };


    body = (function() {
        // mainSection is where the action takes place
        var mainSection = document.querySelector('main');

        // update the body from the views
        body.update = function(viewStruct) {
            var clone = '';

            body.clean();
            console.log('Views', viewStruct.view, 'body.update');
            $('main').removeClass().addClass(viewStruct.view);

            if ('content' in document.createElement('template')) {
                switch(viewStruct.view) {
                    case "index":
                        template = document.getElementById('index');
                        var clone = document.importNode(template.content, true);
                        mainSection.appendChild(clone);
                        break;
                    case "bikes":
                        template = document.getElementById('available');
                        var clone = document.importNode(template.content, true);
                        mainSection.appendChild(clone);
                        break;
                    case "stands":
                        template = document.getElementById('available');
                        var clone = document.importNode(template.content, true);
                        mainSection.appendChild(clone);
                        break;
                    case "starred":
                        template = document.getElementById('starred');
                        clone = document.importNode(template.content, true);
                        mainSection.appendChild(clone);
                        initStarredContent();
                        break;
                    case "station":
                        var stationFormatted = Stations.getFormattedStation(viewStruct.station);

                        template = document.getElementById('stationDetail');
                        template = completeStationDetails(template, stationFormatted);

                        var clone = document.importNode(template.content, true);
                        mainSection.appendChild(clone);
                        break;
                    case "search":
                        template = document.getElementById('search');
                        var clone = document.importNode(template.content, true);
                        mainSection.appendChild(clone);
                        break;
                }
            } else {
                console.log('Views', 'body', 'template is NOT supported');
                switch (viewStruct.view) {
                    case "index":
                        template = $('#index').html();
                        mainSection.append(template);
                    case "bikes":
                        template = $('#bikes').html();
                        mainSection.append(template);
                    case "stands":
                        template = $('#stands').html();
                        mainSection.append(template);
                    case "starred":
                        template = $('#starred').html();
                        mainSection.append(template);
                    case "station":
                        template = $('#stationDetail').html();
                        mainSection.append(template);
                    case "search":
                        template = $('#search').html();
                        mainSection.append(template);
                }
            }
        };

        // Insert in Station template, details from a specific station
        var completeStationDetails = function(template, station) {
            var avail_bike = template.content.querySelector('.bikes');
            var avail_stands = template.content.querySelector('.stands');
            var distance = template.content.querySelector('.distance');
            var position = template.content.querySelector('.position');
            var last_update = template.content.querySelector('.last_update');

            avail_bike.textContent = station.available_bikes;
            avail_stands.textContent = station.available_bike_stands;
            distance.textContent = station.distance;
            position.textContent = station.position;
            last_update.textContent = station.last_update;

            return template;
        };

        // init the table with starred stations
        var initStarredContent = function() {
            var row = '';
            template = document.getElementById('starred');
            row = template.content.querySelector('tbody tr');

            // delete first template row
            var tbody = document.querySelector('tbody');
            while (tbody.firstChild) {
                tbody.removeChild(tbody.firstChild);
            }

            if(Geolocation.waitPosition(initStarredContent) && Stations.waitList(initStarredContent))
            {
                var currentPosition = Geolocation.getPosition();
                var starredStations = Stations.getStarredStations(currentPosition);
                console.log('IDE', starredStations);

                $.each(starredStations, function(id, station) {
                    station = Stations.getFormattedStation(station);

                    // Construction du DOM
                    row.id = station.number;
                    row.querySelector('td.stations > div').textContent = station.address;
                    row.querySelector('td.stations > span.dist').textContent = station.distance;
                    row.querySelector('td.bikes').textContent = station.available_bikes;
                    row.querySelector('td.stands').textContent = station.available_bike_stands;
                    document.querySelector('table.starred tbody').appendChild(document.importNode(row, true));

                    $( "#" +  station.number).click(function() {
                        window.location.hash = "/station/" + station.number;
                    });
                });
            }
        };

        body.clean = function() {
            // cleaning the content
            console.log('Views', 'body', 'empty');
            $(mainSection).empty();
        };

        return body;

    })();


    var index = function() {
        viewStruct.view = "index";

        Geolocation.noWaitPosition();
        Stations.noWaitList();
        // clean by removing stations swiper
        $('.swiper-wrapper, .pagination').empty().attr('style', '');

        body.clean();
        console.log('Views', "Index", "display page");
        body.update(viewStruct);

        $('.entry.bikes').click(function() {
            window.location.hash = "/bikes";
        });
        $('.entry.stands').click(function() {
            window.location.hash = "/stands";
        });
        $('.entry.starred').click(function() {
            window.location.hash = "/starred";
        });
        $('.entry.search').click(function() {
            window.location.hash = "/search";
        });
    };

    var bikes = function() {
        viewStruct.view = "bikes";
        viewStruct.title = "Vélos disponibles";
        viewStruct.img = "velib";
        viewStruct.src = "plus-pink.svg";
        viewStruct.alt = "plus";
        viewStruct.value = "Informations";
        viewStruct.prop = "readonly";

        body.update(viewStruct);

        if (Geolocation.waitPosition(bikes) && Stations.waitList(bikes)) {
           var stations = Stations.getClosestStations(Geolocation.getPosition(), 10, function(item) {
                return item.available_bikes > 0;
            });
            console.log(stations);

            // Stations slides creation
            var newSlide = '';
            for (var i = 0; i < stations.length; i++) {
                console.log(stations[i].name);
                newSlide = swiper.createSlide('<div>Station ' + stations[i].name + '<br>Vélos disponibles ' + stations[i].available_bikes + '</div>');
                newSlide.append();
                //$('.available-element').text('Vélos disponibles ' + stations[i].available_bikes);
                //$('.adresse').text('Station ' + stations[i].name);
            }
            RoadMap.initCircle(Geolocation.getPosition());

            var station_detail = $('.swiper-slide-active')[0].firstChild.childNodes[0].nodeValue.split(' ',2);
            var active_station = Stations.getStationDetails(station_detail[1]); // get details for the active slide
            RoadMap.addMarker(Geolocation.getPosition(), active_station, viewStruct.view);
        }
        else
            console.log('Views', 'bikes', 'Looking for geolocation');
    };

    var stands = function() {
        viewStruct.view = "stands";
        viewStruct.title = "Places libres";
        viewStruct.img = "borne";
        viewStruct.src = "plus-blue.svg";
        viewStruct.alt = "plus";
        viewStruct.value = "Informations";
        viewStruct.prop = "readonly";

        console.log('Views', viewStruct.view, "display page");
        body.update(viewStruct);

        if (Geolocation.waitPosition(stands) && Stations.waitList(stands)) {
            var stations = Stations.getClosestStations(Geolocation.getPosition(), 10, function(item) {
                return item.available_bike_stands > 0;
            });
            console.log(stations);

            // Stations slides creation
            var newSlide = '';
            for (var i = 0; i < stations.length; i++) {
                console.log(stations[i].name);
                newSlide = swiper.createSlide('<div>Station ' + stations[i].name + '<br>Bornes disponibles ' + stations[i].available_bikes + '</div>');
                newSlide.append();
                //$('.available-element').text('Vélos disponibles ' + stations[i].available_bikes);
                //$('.adresse').text('Station ' + stations[i].name);
            }
            RoadMap.initCircle(Geolocation.getPosition());

            var station_detail = $('.swiper-slide-active')[0].firstChild.childNodes[0].nodeValue.split(' ',2);
            var active_station = Stations.getStationDetails(station_detail[1]); // get details for the active slide
            RoadMap.addMarker(Geolocation.getPosition(), active_station, viewStruct.view);
        }
        else if (!Geolocation.waitPosition(stands)) {
            console.log('Views', 'stands', 'Looking for geolocation');
        }
    };

    var starred = function() {
        viewStruct.view = "starred";
        viewStruct.title = "Favoris";
        viewStruct.img = "favori";
        viewStruct.src = "plus-violet.svg";
        viewStruct.alt = "plus";
        viewStruct.value = "Ajouter";
        viewStruct.prop = "readonly";

        console.log('Views', viewStruct.view, "display page");
        body.update(viewStruct);

        Geolocation.noWaitPosition();
        if (Geolocation.waitPosition(starred) && Stations.waitList(starred)) {
            console.log(Stations.getClosestStations(Geolocation.getPosition(), 10, function(item) {
                return item.starred > 0;
            }));
            $('.station-info').html('');
        }
    };

    var station = function() {
        var pathArray = window.location.hash.split('/');
        console.log("pathArray : "+ pathArray);
        var station_id = pathArray[pathArray.length-1];
        console.log("station_id : "+station_id);

        if (Geolocation.waitPosition(station) && Stations.waitList(station)) {
            // Allow to get distance between station and current position
            var stations = Stations.getClosestStations(Geolocation.getPosition());

            viewStruct.station = Stations.getStationDetails(station_id)[0];
            console.log("viewStruct.station : "+ viewStruct.station);
            var station_exist = $.grep(stations, function(v) {
                return v.number == station_id;
            });

            // If station doesn't exist : redirection
            if (station_exist.length == 0) {
                alert("La station n'existe pas !");
                console.log("Views.js", "station", "station doesn't exist", station_exist.length);
                window.location.hash = "/index";
            } else {
                viewStruct.view = "station";
                viewStruct.title = viewStruct.station.address;
                viewStruct.img = "favori";
                viewStruct.src = "plus-dark-blue.svg";
                viewStruct.alt = "plus";
                viewStruct.value = "Ajouter aux favoris";
                viewStruct.prop = "readonly";

                console.log('Views', viewStruct.view, "display page");
                body.update(viewStruct);

                var station_id = window.location.hash.substr(2).split("/")[1];

                // click to starred the station
                $(".vplus").click(function() {
                    var returnedStation = Stations.toggleStarStation(station_id);
                    //alert(returnedStation ? "La station " + station_id + " a été ajoutée/retirée." : "Indice invalide");
                });
            }
        }
    };

    var search = function() {
        viewStruct.view = "search";
        viewStruct.title = "Rechercher";
        viewStruct.img = "loupe";
        viewStruct.src = "search-yellow.svg";
        viewStruct.alt = "loupe";
        viewStruct.value = "";
        viewStruct.prop = "placeHolder='Rechercher'";

        console.log('Views', viewStruct.view, "display page");
        body.update(viewStruct);

        RoadMap.init();
        RoadMap.addMarkers();

        if(Geolocation.waitPosition(search)) {
            var pos = Geolocation.getPosition();
            RoadMap.addMarkerPosition(pos);
        }

        $('.station-info, .info').addClass('hidden');

    };

    return {
        init: init,
        index: index,
        bikes: bikes,
        stands: stands,
        starred: starred,
        station: station,
        search: search
    };

})();
