import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Shelter, ShelterWithDistance } from '../types/shelter';
import { ServiceTag } from './ServiceTag';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';
import { formatDistance } from '../data/distanceUtils';

interface Props {
  shelter: Shelter | ShelterWithDistance;
  onPress: () => void;
}

function getStatusStyle(status: Shelter['status']) {
  switch (status) {
    case 'open':
      return { color: Colors.statusOpen, label: 'Open' };
    case 'limited':
      return { color: Colors.statusLimited, label: 'Limited Space' };
    case 'closed':
      return { color: Colors.statusClosed, label: 'Closed' };
  }
}

export function ShelterCard({ shelter, onPress }: Props) {
  const statusInfo = getStatusStyle(shelter.status);
  const distance = 'distance' in shelter ? shelter.distance : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${shelter.name}, ${statusInfo.label}`}
    >
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={2}>
          {shelter.name}
        </Text>
        {distance != null && (
          <Text style={styles.distance}>{formatDistance(distance)}</Text>
        )}
      </View>

      <Text style={styles.address} numberOfLines={1}>
        {shelter.address.street}, {shelter.address.city},{' '}
        {shelter.address.state}
      </Text>

      <View style={styles.tags}>
        {shelter.type.map((t) => (
          <ServiceTag key={t} type={t} />
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={[styles.status, { color: statusInfo.color }]}>
          {statusInfo.label}
        </Text>
        {shelter.capacity.totalBeds > 0 && (
          <Text style={styles.beds}>
            {shelter.capacity.totalBeds} beds
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Layout.borderRadius,
    padding: Layout.cardPadding,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: Layout.fontSizeH3,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 21,
  },
  distance: {
    fontSize: Layout.fontSizeXSmall,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  address: {
    fontSize: Layout.fontSizeSmall,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  status: {
    fontSize: Layout.fontSizeSmall,
    fontWeight: '500',
  },
  beds: {
    fontSize: Layout.fontSizeSmall,
    color: Colors.textSecondary,
  },
});
