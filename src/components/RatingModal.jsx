import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const ThemeColors = {
  background: '#0f1923',
  card: 'rgba(23,39,54,1)',
  border: 'rgba(77,169,255,0.25)',
  primary: '#4da9ff',
  text: '#ffffff',
  subText: '#94a3b8',
  overlay: 'rgba(0,0,0,0.9)',
  warning: '#FFD54F',
};

const RATING_SUBMITTED_KEY = 'RATING_SUBMITTED';
const RATING_LAST_SHOWN_KEY = 'RATING_LAST_SHOWN';
const APP_OPEN_COUNT_KEY = 'APP_OPEN_COUNT';

const DAYS_DELAY = 3;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

export default function RatingModal() {

  const [visible, setVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);

  const fadeAnim =
    useRef(
      new Animated.Value(0)
    ).current;

  const scaleAnim =
    useRef(
      new Animated.Value(0.8)
    ).current;

  useEffect(() => {
    checkRatingStatus();
  }, []);

  useEffect(() => {

    if (visible) {

      Animated.parallel([

        Animated.timing(
          fadeAnim,
          {
            toValue:1,
            duration:300,
            useNativeDriver:true,
          }
        ),

        Animated.spring(
          scaleAnim,
          {
            toValue:1,
            tension:100,
            friction:8,
            useNativeDriver:true,
          }
        ),

      ]).start();

    } else {

      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);

    }

  },[visible]);

  const checkRatingStatus = async () => {

    try {

      const submitted =
        await AsyncStorage.getItem(
          RATING_SUBMITTED_KEY
        );

      if(
        submitted === 'true'
      ){
        return;
      }

      let openCount =
        parseInt(
          (
            await AsyncStorage.getItem(
              APP_OPEN_COUNT_KEY
            )
          ) || '0',
          10
        );

      openCount++;

      await AsyncStorage.setItem(
        APP_OPEN_COUNT_KEY,
        String(openCount)
      );

      // First open
      if(openCount===1){
        return;
      }

      const lastShown =
        await AsyncStorage.getItem(
          RATING_LAST_SHOWN_KEY
        );

      const now = Date.now();

      // Second open
      if(!lastShown){

        setVisible(true);

        await AsyncStorage.setItem(
          RATING_LAST_SHOWN_KEY,
          String(now)
        );

        return;
      }

      const timePassed =
        now -
        parseInt(lastShown,10);

      if(
        timePassed >
        DAYS_DELAY *
        MS_IN_DAY
      ){

        setVisible(true);

        await AsyncStorage.setItem(
          RATING_LAST_SHOWN_KEY,
          String(now)
        );

      }

    }
    catch(e){

      console.log(
        'Rating check error:',
        e
      );

    }

  };

  const handleStarPress=(rating)=>{
    setSelectedRating(
      rating
    );
  };

  const handleRateNow =
  async()=>{

    try{

      await AsyncStorage.setItem(
        RATING_SUBMITTED_KEY,
        'true'
      );

      setVisible(false);

      const url =
        Platform.OS === 'android'
        ? 'market://details?id=com.numberflow.game'
        : 'itms-apps://itunes.apple.com/app/idYOUR_APP_ID?action=write-review';

      const fallbackUrl =
        Platform.OS === 'android'
        ? 'https://play.google.com/store/apps/details?id=com.numberflow.game'
        : 'https://apps.apple.com/app/idYOUR_APP_ID?action=write-review';

      const supported =
        await Linking.canOpenURL(
          url
        );

      if(
        supported
      ){
        Linking.openURL(url);
      }
      else{
        Linking.openURL(
          fallbackUrl
        );
      }

    }
    catch(e){

      console.log(
        'Rating submit error:',
        e
      );

    }

  };

  const handleRemindLater=()=>{
    setVisible(false);
  };

  return (

    <Modal
      transparent
      visible={visible}
      animationType="none"
    >

      <Animated.View
        style={[
          styles.overlay,
          {
            opacity:fadeAnim
          }
        ]}
      >

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform:[
                {
                  scale:
                  scaleAnim
                }
              ]
            }
          ]}
        >

          <TouchableOpacity
            style={styles.closeButton}
            onPress={
              handleRemindLater
            }
          >
            <Text
              style={
                styles.closeButtonText
              }
            >
              ×
            </Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            Excellent!
          </Text>

          <View
            style={
              styles.starsContainer
            }
          >

            {[1,2,3,4,5]
            .map(star=>(

              <TouchableOpacity
                key={star}
                onPress={()=>
                  handleStarPress(
                    star
                  )
                }
              >

                <Text
                  style={[
                    styles.star,
                    {
                      color:
                      star<=selectedRating
                      ? ThemeColors.warning
                      :'#E0E0E0'
                    }
                  ]}
                >
                  ★
                </Text>

              </TouchableOpacity>

            ))}

          </View>

          <Text
            style={
              styles.subtitle
            }
          >
            Thanks for loving us!
          </Text>

          <Text
            style={
              styles.description
            }
          >
            Spread the word by rating us on Play Store
          </Text>

          <View
            style={
              styles.buttonsRow
            }
          >

            <TouchableOpacity
              style={
                styles.laterBtn
              }
              onPress={
                handleRemindLater
              }
            >
              <Text
                style={
                  styles.laterText
                }
              >
                Later
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.rateButton
              }
              onPress={
                handleRateNow
              }
            >
              <Text
                style={
                  styles.rateButtonText
                }
              >
                Rate Us
              </Text>
            </TouchableOpacity>

          </View>

        </Animated.View>

      </Animated.View>

    </Modal>
  );
}

const styles = StyleSheet.create({

overlay:{
flex:1,
backgroundColor:ThemeColors.overlay,
justifyContent:'center',
alignItems:'center',
},

modalContainer:{
width:width*0.85,
borderRadius:20,
padding:28,
alignItems:'center',
backgroundColor:ThemeColors.card,
borderWidth:1,
borderColor:ThemeColors.border,
},

closeButton:{
position:'absolute',
top:12,
right:15,
},

closeButtonText:{
fontSize:26,
color:ThemeColors.subText,
},

title:{
fontSize:26,
fontWeight:'800',
color:ThemeColors.text,
marginBottom:10,
},

subtitle:{
fontSize:16,
fontWeight:'600',
color:ThemeColors.text,
marginBottom:6,
},

description:{
fontSize:13,
color:ThemeColors.subText,
textAlign:'center',
marginBottom:20,
},

starsContainer:{
flexDirection:'row',
marginVertical:15,
},

star:{
fontSize:34,
marginHorizontal:6,
},

buttonsRow:{
flexDirection:'row',
width:'100%',
marginTop:10,
},

laterBtn:{
flex:1,
backgroundColor:'#3a4f63',
paddingVertical:14,
borderRadius:14,
marginRight:8,
alignItems:'center',
},

laterText:{
color:'#fff',
fontSize:15,
fontWeight:'700',
},

rateButton:{
flex:1,
backgroundColor:ThemeColors.primary,
paddingVertical:14,
borderRadius:14,
marginLeft:8,
alignItems:'center',
},

rateButtonText:{
color:'#0f1923',
fontWeight:'800',
fontSize:16,
}

});