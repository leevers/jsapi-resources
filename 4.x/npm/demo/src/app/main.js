define([
  "dojo/has",
  "esri/config",
  "esri/widgets/Sketch/SketchViewModel",
  "esri/geometry/Polyline",
  "esri/geometry/Point",
  "esri/Graphic",
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/geometry/geometryEngine",
  "esri/widgets/Expand",
  "esri/widgets/Legend",
  "esri/widgets/Search",
  "esri/widgets/Sketch",
  "esri/symbols/WaterSymbol3DLayer",
  "esri/symbols/PolygonSymbol3D",
  "esri/WebScene",
  "esri/core/watchUtils"
], function (
  has,
  esriConfig,
  SketchViewModel,
  Polyline,
  Point,
  Graphic,
  Map,
  SceneView,
  FeatureLayer,
  GraphicsLayer,
  geometryEngine,
  Expand,
  Legend,
  Search,
  Sketch,
  WaterSymbol3DLayer,
  PolygonSymbol3D,
  WebScene,
  watchUtils
) {
  if (!has("dojo-built")) {
    esriConfig.workers.loaderConfig = {
      paths: {
        "esri": "../arcgis-js-api",
        "dstore": "../dojo-dstore"
      }
    };
  }

  var map = new Map({
    basemap: "gray-vector"
  });

  var sceneViewConfig = {
    map: map,
    container: "viewer",
  };
  var view = new SceneView(sceneViewConfig);

  view.on("click", function(clickPoint)
  {
    if (clickPoint.button === 2)
    {
      view.hitTest(clickPoint).then(function(hitResult)
      {
        console.log(hitResult);
        if (hitResult.results.length > 0) {
          var currentResult = hitResult.results[0];
          view.whenLayerView(currentResult.graphic.layer).then(function(layerView)
          {
            layerView.highlight(currentResult.graphic);
          });
        }
      });
    } else {
      return;
    }
  });

  view.when(function() {
    if (view.environment.lighting) {
      view.environment.lighting.waterReflectionEnabled = true;
    }

    console.log("Loaded");

    var graphicsLayer = new GraphicsLayer({
      title: "Design Layer",
      visible: true,
      elevationInfo: {
        mode: "on-the-ground",
      },
    });

    var sketch = new Sketch({
      layer: graphicsLayer,
      view: view,
    });

    map.add(graphicsLayer);

    sketch.on("create", function(sketchEvent) {
      // check if the create event's state has changed to complete indicating
      // the graphic create operation is completed.
      if (sketchEvent.state === "complete") {
        var waterSymbolLayer = new WaterSymbol3DLayer();
        var waterSymbol = new PolygonSymbol3D({
          symbolLayers: [waterSymbolLayer],
        });

        var newGraphic = sketchEvent.graphic.clone();
        try
        {
          var bufferedGeometry = geometryEngine.geodesicBuffer(
            newGraphic.geometry,
            10,
            "kilometers"
          );
        }
        catch(ex)
        {
          bufferedGeometry = newGraphic.geometry.clone();
          console.log(ex,ex.stack);
          debugger;
          throw(ex);
        }

        newGraphic.geometry = bufferedGeometry;
        newGraphic.symbol = waterSymbol;

        // remove the graphic from the layer. Sketch adds
        // the completed graphic to the layer by default.
        graphicsLayer.remove(sketchEvent.graphic);

        graphicsLayer.add(newGraphic);

        // console.log(JSON.stringify(sketchEvent.graphic.toJSON(), null, 2));
      }
    });

    view.ui.add(sketch, "top-right");
  });
});