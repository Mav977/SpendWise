import { View, Text, ViewStyle, useColorScheme } from 'react-native'
import React from 'react'
import { Colors } from '../styles/theme';
interface CardProps extends React.PropsWithChildren {
 style?: ViewStyle | ViewStyle[];
}
const Card = ({children,style={}}:CardProps) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  return (
    <View
      style={[{
        padding: 15,
        borderRadius: 15,
        backgroundColor: theme.card,
        elevation: 8,
        shadowColor: theme.shadow,
        shadowRadius: 8,
        shadowOffset: { height: 6, width: 0 },
        shadowOpacity: 0.15,
      },style]}
    >
      {children}
    </View>
  )
}

export default Card
