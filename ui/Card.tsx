import { View, Text, ViewStyle } from 'react-native'
import React from 'react'
interface CardProps extends React.PropsWithChildren {
 style?: ViewStyle | ViewStyle[];
}
const Card = ({children,style={}}:CardProps) => {
  return (
    <View
      style={{
        padding: 15,
        borderRadius: 15,
        backgroundColor: "white",
        elevation: 8,
        shadowColor: "#000",
        shadowRadius: 8,
        shadowOffset: { height: 6, width: 0 },
        shadowOpacity: 0.15,
        ...style,
      }}
    >
      {children}
    </View>
  )
}

export default Card