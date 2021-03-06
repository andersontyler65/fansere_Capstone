import React, {Component} from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Animated,
  Image,
  Dimensions,
  TouchableHighlight,
  Alert
} from "react-native"
import MapView, {PROVIDER_GOOGLE} from 'react-native-maps'
import firebase from 'firebase'
import 'firebase/firestore'

const {width, height} = Dimensions.get("window")
const CARD_HEIGHT = height / 4;
const CARD_WIDTH = CARD_HEIGHT - 50;

export default class Maps extends Component<Props> {

  state = {
    region: {
      latitude: 40.0166,
      longitude: -105.2817,
      latitudeDelta: 0.04864195044303443,
      longitudeDelta: 0.040142817690068
    },
    markers: [],

  }

  componentWillMount() {
    this.index = 0;
    this.animation = new Animated.Value(0)
  }

  componentDidMount() {
    // We should detect when scrolling has stopped then animate
    // We should just debounce the event listener here
    this.animation.addListener(({ value }) => {
      let index = Math.floor(value / CARD_WIDTH + 0.3) // animate 30% away from landing on the next item
      if (index >= this.state.markers.length) {
        index = this.state.markers.length - 1;
      }
      if (index <= 0) {
        index = 0;
      }

      clearTimeout(this.regionTimeout)
      this.regionTimeout = setTimeout(() => {
        if (this.index !== index) {
          this.index = index
          const { coordinate } = this.state.markers[index]
          this.map.animateToRegion(
            {
              ...coordinate,
              latitudeDelta: this.state.region.latitudeDelta,
              longitudeDelta: this.state.region.longitudeDelta,
            },
            350
          );
        }
      }, 10)
    })
    // get route for firebase
   firebase.firestore().collection('BoulderBars')
    .where('city', '==', 'boulder')
    .get().then(snapshot=> {
      snapshot.docs.forEach(doc=> {
        let barObj = {

        }
        barObj.coordinate = {
          latitude: doc.data().coordinate.latitude,
          longitude: doc.data().coordinate.longitude
        },
        barObj.title = doc.data().name,
        barObj.description = doc.data().description,
        barObj.image = {uri : doc.data().image},
        barObj.website = doc.data().website
        this.setState({markers:[...this.state.markers, barObj]})

      })
    })
  }


  _onPressButton() {

  }


  render() {

    const interpolations = this.state.markers.map((marker, index) => {
      const inputRange = [
        (index - 1) * CARD_WIDTH,
        index * CARD_WIDTH,
        ((index + 1) * CARD_WIDTH)
      ];
      const scale = this.animation.interpolate({
        inputRange,
        outputRange: [
          1, 2.5, 1
        ],
        extrapolate: "clamp"
      });
      const opacity = this.animation.interpolate({
        inputRange,
        outputRange: [
          0.35, 1, 0.35
        ],
        extrapolate: "clamp"
      });
      return {scale, opacity}
    });

    return (<View style={styles.container}>
      <MapView ref={map => this.map = map} initialRegion={this.state.region} style={styles.container}>
        {
          this.state.markers.map((marker, index) => {
            const scaleStyle = {
              transform: [
                {
                  scale: interpolations[index].scale
                }
              ]
            };
            const opacityStyle = {
              opacity: interpolations[index].opacity
            };
            return (<MapView.Marker key={index} coordinate={marker.coordinate}>
              <Animated.View style={[styles.markerWrap, opacityStyle]}>
                <Animated.View style={[styles.ring, scaleStyle]}/>
                <View style={styles.marker}/>
              </Animated.View>
            </MapView.Marker>)
          })
        }
        {
          this.state.markers.map((marker, index) => {
            return (<MapView.Marker key={index} coordinate={marker.coordinate}>
              <Animated.View style={[styles.markerWrap]}>
                <Animated.View style={[styles.ring]}/>
                <View style={styles.marker}/>
              </Animated.View>
            </MapView.Marker>)
          })
        }
      </MapView>
      <Animated.ScrollView horizontal="horizontal" scrollEventThrottle={1} showsHorizontalScrollIndicator={false} snapToInterval={CARD_WIDTH} onScroll={Animated.event([
          {
            nativeEvent: {
              contentOffset: {
                x: this.animation
              }
            }
          }
        ], {useNativeDriver: true})} style={styles.scrollView} contentContainerStyle={styles.endPadding}>
        {
          this.state.markers.map((marker, index) => (
            <TouchableHighlight onPress={this._onPressButton} underlayColor="white" key={index}>
            <View style={styles.card} >
            <Image  source={marker.image} style={styles.cardImage} resizeMode="stretch"/>
            <View style={styles.textContent}>
              <Text numberOfLines={1} style={styles.cardtitle}>{marker.title}</Text>
              <Text numberOfLines={2} style={styles.cardDescription}>
                {marker.description}
              </Text>
            </View>
          </View>
        </TouchableHighlight>))
        }
      </Animated.ScrollView>
    </View>);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollView: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    paddingVertical: 10
  },
  endPadding: {
    paddingRight: width - CARD_WIDTH
  },
  card: {
    padding: 10,
    elevation: 2,
    backgroundColor: "#FFF",
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowRadius: 5,
    shadowOpacity: 0.3,
    shadowOffset: {
      x: 2,
      y: -2
    },
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    overflow: "hidden"
  },
  cardImage: {
    flex: 3,
    width: "100%",
    height: "100%",
    alignSelf: "center"
  },
  textContent: {
    flex: 1
  },
  cardtitle: {
    fontSize: 12,
    marginTop: 5,
    fontWeight: "bold"
  },
  cardDescription: {
    fontSize: 12,
    color: "#444"
  },
  markerWrap: {
    alignItems: "center",
    justifyContent: "center"
  },
  marker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(128,128,128, 0.9)"

  },
  ring: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,255,0, 0.3)",
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(0,255,0, 0.5)"
  }
});
