import React, { useState, useRef, useEffect } from 'react';
import { Alert, View, StyleSheet, Animated, Dimensions, PanResponder } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

const shapes = ['circle', 'rectangle', 'line'];

const getRandomInt = (min, max) => {
  let randomNumber = 0;
  while (randomNumber <= min)
    randomNumber = Math.floor(Math.random() * max)

  return randomNumber;
}

export default function App() {
  const [currentShape, setCurrentShape] = useState(0);
  const [showCircle, setShowCircle] = useState(false);
  const [circleDiameter, setCircleDiameter] = useState(0);
  const [circlePosition, setCirclePosition] = useState({ x: 0, y: 0 });
  const [randomHeight, setRandomHeight] = useState(getRandomInt(50, 500));
  const [randomWidth, setRandomWidth] = useState(getRandomInt(50, 500));
  const [randomRotate, setRandomRotate] = useState(getRandomInt(0, 360));

  const startTouch = useRef({ x: 0, y: 0 }).current;
  
  const scale = new Animated.Value(1);
  const rotate = new Animated.Value(0);

  useEffect(() => {
    setRandomHeight(getRandomInt(50, 500));
    setRandomWidth(getRandomInt(50, 500));
    setRandomRotate(getRandomInt(0, 360));
  }, [currentShape])

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      if (evt.nativeEvent.touches.length === 2) {
        setShowCircle(true);
      }
    },
    onPanResponderMove: (evt) => {
      if (evt.nativeEvent.touches.length === 2) {
        const [firstTouch, secondTouch] = evt.nativeEvent.touches;

        const dx = secondTouch.pageX - firstTouch.pageX;
        const dy = secondTouch.pageY - firstTouch.pageY;
        const diameter = Math.sqrt(dx * dx + dy * dy) * 2;

        setCircleDiameter(diameter);
        setCirclePosition({
          x: (firstTouch.pageX + secondTouch.pageX) / 2 - diameter / 2,
          y: (firstTouch.pageY + secondTouch.pageY) / 2 - diameter / 2,
        });
      }
    },
    onPanResponderRelease: (evt) => {
      checkIfFits();
      setShowCircle(false);
      setCurrentShape((currentShape + 1) % shapes.length);
      setCircleDiameter(0);
    },
  });

  const animatedStyles = {
    transform: [
      { scale: scale },
      {
        rotate: rotate.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  async function playSound(isSuccess) {
    try {
      const soundFile = isSuccess
        ? require('./assets/sounds/coin.mp3')
        : require('./assets/sounds/error.mp3');
      
      const { sound } = await Audio.Sound.createAsync(
        soundFile,
        { shouldPlay: true }
      );
      
      await sound.playAsync();
    } catch (error) {
      console.error("Error loading sound:", error);
    }
  }

  const checkIfFits = () => {
    let isFits = false;
    let sizeLeft = 0;
    switch (shapes[currentShape]) {
      case 'circle':
        isFits = circleDiameter >= width;
        sizeLeft = isFits ? circleDiameter - width : width - circleDiameter;
        break;
      case 'rectangle':
        var diagonal = Math.sqrt(Math.pow(randomWidth, 2) + Math.pow(randomHeight, 2));
        isFits = circleDiameter >= diagonal;
        sizeLeft = isFits ? circleDiameter - diagonal : diagonal - circleDiameter;
        break;
      case 'line':
        var diagonal = Math.sqrt(Math.pow(randomWidth, 2) + Math.pow(10, 2));
        isFits = circleDiameter >= diagonal;
        sizeLeft = isFits ? circleDiameter - diagonal : diagonal - circleDiameter;
        break;
    }
    if (isFits && showCircle) {
      Alert.alert("Pavyko!", `Dar liko ${Math.round(sizeLeft)} pikselių`, [
        { text: "OK" },
      ]);
      playSound(true);
      return;
    }
    else if (showCircle) {
      Alert.alert("Nepavyko :(", `Trūksta ${Math.round(sizeLeft)} pikselių`, [
        { text: "OK" },
      ]);
      playSound(false);
      return;
    }
  };

  const renderShape = () => {
    switch (shapes[currentShape]) {
      case 'circle':
        return (
          <Animated.View
            style={[
              styles.circle,
              animatedStyles,
              { width: randomWidth, height: randomWidth },
            ]}
          />
        );
      case 'rectangle':
        return (
          <Animated.View
            style={[
              styles.square,
              animatedStyles,
              {
                width: randomWidth,
                height: randomHeight,
                transform: [{ rotate: `${randomRotate}deg` }],
              },
            ]}
          />
        );
      case 'line':
        return (
          <Animated.View
            style={[
              styles.line,
              animatedStyles,
              { width: randomWidth, transform: [{ rotate: `${randomRotate}deg` }] },
            ]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View {...panResponder.panHandlers} style={styles.container}>
        {renderShape()}
        {showCircle && (
          <View
            style={[
              styles.circle,
              {
                width: circleDiameter,
                height: circleDiameter,
                left: circlePosition.x,
                top: circlePosition.y,
                borderWidth: 3,
                borderColor: '#3498db',
                backgroundColor: 'rgba(0, 0, 0, 0)',
              },
            ]}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    width: width,
    height: height,
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
  },
  square: {
    width: 100,
    height: 100,
    backgroundColor: '#3498db',
  },
  line: {
    width: 150,
    height: 10,
    backgroundColor: '#2ecc71',
  },
});
