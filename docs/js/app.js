function set_defaults() {
    localStorage["constants_vent"] = JSON.stringify([1.0, -1.0, 3.0, 4.0,5.0,3.5, 1.0]);
}

function toggle_element_vis(elem){
    var x = document.getElementById(elem);
    if (x.style.display === "none") {
        x.style.display = "block";
    } else {
        x.style.display = "none";
    }
}

function fetch_met_no_and_cache(){
    if (! localStorage.getItem("lat") || !localStorage.getItem("lon")){
        alert("Bitte geben Sie ihren Standort in den Einstellungen für die Wetterdaten ein.");
        throw new Error("Can not get weather data!")
        return
    }
    lat = localStorage["lat"];
    lon = localStorage["lon"];

    fetch('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat='+lat+'&lon='+lon).then(response => {return response.json()})
    .then(response => {
        var result = response["properties"]["timeseries"]
        var last_difference = Date.now();
        var difference
        for (let i = 0; i < result.length; i++){
            difference = Math.abs(Date.parse(result[i]["time"])-Date.now());
            if (difference > last_difference){
                localStorage["t_out"] = result[i-1]["data"]["instant"]["details"]["air_temperature"];
                setWithExpiry("h_out", result[i-1]["data"]["instant"]["details"]["relative_humidity"])
                return;
            }
            last_difference = difference
        }
    })
    .catch((error) => {
    console.error('Error:', error);alert("Bitte stellen Sie sicher das sie eine Internetverbindung haben, damit die Wetterdaten abgerufen werden können")
    });
}

//The concept of the following to function comes from https://www.sohamkamani.com/blog/javascript-localstorage-with-ttl-expiry/
function setWithExpiry(key, value, ttl=3600000) {
	const now = new Date()

	// `item` is an object which contains the original value
	// as well as the time when it's supposed to expire
	const item = {
		value: value,
		expiry: now.getTime() + ttl,
	}
	localStorage.setItem(key, JSON.stringify(item))
}

function get_weather_data() {
	const itemStr = localStorage.getItem("h_out")
	// if the item doesn't exist, return null
	if (!itemStr) {
		fetch_met_no_and_cache()
        return;
	}
	const item = JSON.parse(itemStr)
	const now = new Date()
	// compare the expiry time of the item with the current time
	if (now.getTime() > item.expiry) {
		// If the item is expired, delete the item from storage
		// and return null
		localStorage.removeItem("h_out")
        localStorage.removeItem("t_out")
		fetch_met_no_and_cache();
	}
	return item.value
}

function import_settings(File) {
    read = new FileReader();
    read.readAsBinaryString(File);
    var json_data = JSON.parse(read.result);
    for (var key in json_data) {
        localstorage[key] = json_data[key];
    };
}

function to_absolute(h, t) {
    C_2 = 2.53 * 1000000000;
    L = 2.501 * 1000000;
    R_w = 461.5;
    e_s =  C_2* Math.exp( (-L)/R_w/(t+273,15));
    return e_s*(h/100);
}

function to_relative(absolute, t) {
    C_2 = 2.53 * 1000000000;
    L = 2.501 * 1000000;
    R_w = 461.5;
    e_s =  C_2* Math.exp( (-L)/R_w/(t+273,15));
    return 100*(absolute/e_s);
}

function temperature_model(t0, t_out0, t, cons){
    return (t0-(t_out0*cons[3]))*cons[4]/(cons[4] + t**(cons[5]/(cons[6]*localStorage["room-size"]))) + (t_out0*cons[3])
}

function humidity_model(h0, h_out0, t, cons){
    return (h0-h_out0)*cons[0]/(cons[0] + t**((cons[1]*localStorage["window-size"])/(cons[2]*localStorage["room-size"]))) + h_out0
}


function humidity_over_time_vent(h0, t0, t_out0, h_out0, cons) {
    var cons = JSON.parse(localStorage["constants_vent"]);
    var absolute = to_absolute(h0, t0);
    var absolute_out = to_absolute(h_out0, t_out0);

    function vent_humidity(t) {
        return to_relative(humidity_model(absolute, absolute_out, t, cons), temperature_model(t0, t_out0, t, cons));

    };
    return vent_humidity
}

function x_and_y_values(func, start, end, steps) {
    var x = []
    var y = []
    for (let i = start; i <= end; i += steps) {
        x.push(i)
        y.push(func(i))
    }

    return [x, y]}

function plot_graph(data, destination) {
    new Chartist.Line(destination, {
        labels: data[0],
        series: [
            data[1]
        ]
    });
}

function vent() {
    var t0 = document.getElementById('t0').value;
    var h0 = document.getElementById('h0').value;
    h_out = get_weather_data()
    var func = humidity_over_time_vent(h0, t0, localStorage["t_out"], h_out, JSON.parse(localStorage["constants_vent"]));
    plot_graph(x_and_y_values(func, 0, 40, 1), '.vent')
    i = 0;
    if (!func(i)){
        alert("Etwas ist schief gegangen, wahrscheinlich müssen Sie ihre Daten unter Einstellungen eingeben")
        throw new Error("Returned null")
    }
    if (h_out >= 65){
    while (true){
        if (func(i) < 65){
            vent_time = i;
            break;
        }
        if (i >1000){
            document.getElementById("vent_time").textContent = "Die Luftfeuchtigkeit fällt auf absehbare Zeit nicht unter  Werte";
        }
        i++;
    }document.getElementById("vent_time").textContent = "Sie sollten: " + vent_time + " min lüften.";
    } else{
        document.getElementById("vent_time").textContent = "Die Luftfeuchtigkeit fällt auf absehbare Zeit nicht unter möglicherweise schimmelbildende Werte";
    }
    
}

function insertAfter(referenceNode, newNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

var current_datapoint = 1;

function new_datapoint(){
    var keep_data = document.getElementById("keep_data").checked
    var current_data = document.getElementById("current_data").checked

    var new_datapoint = document.getElementById("datapoint" + (current_datapoint-1)).cloneNode(true);

    new_datapoint.id = "datapoint" + current_datapoint

    for (var i = 1; i < new_datapoint.childNodes.length-2; i+=2){
        new_datapoint.childNodes[i].childNodes[0].childNodes[0].id = new_datapoint.childNodes[i].childNodes[0].childNodes[0].id.split("_")[0] + "_"+current_datapoint;

        if (!keep_data){
            new_datapoint.childNodes[i].childNodes[0].childNodes[0].value = "";
        }
    }

    insertAfter(document.getElementById("datapoint"+(current_datapoint-1)), new_datapoint);
    current_datapoint += 1;
}

function train(){
    temperature = document.getElementById("T_0");
    humidity = [];
    local_time = [];

    for (var i = 1; i < current_datapoint; i++){
        current_x = []
        var datapoint = document.getElementById("datapoint"+i);
        local_time.push(datapoint.childNodes[1].childNodes[0].childNodes[0].value);
        humidity.push(datapoint.childNodes[3].childNodes[0].childNodes[0].value);
    }

    fnc = function(cons){
        model_prediction = humidity_over_time_vent(humidity[0], temperature, localStorage["t_out"], get_weather_data(), cons);
        sum = 0
        for (var i = 0; i < humidity.length; i++){
            sum += (model_prediction(local_time[i])-humidity[i])**2;
        };
        return sum;
    };
    var solution = optimjs.minimize_Powell(fnc, JSON.parse(localStorage["constants_vent"]));
    localStorage["constants_vent"] = JSON.stringify(solution["argument"]);

    alert("Das Modell wurde angepasst");
};
