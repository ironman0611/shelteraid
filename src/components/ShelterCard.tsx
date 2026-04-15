import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { Shelter, ShelterWithDistance } from '../types/shelter';
import { ServiceTag } from './ServiceTag';
import { formatDistance } from '../data/distanceUtils';
import { useTheme } from '../theme/useTheme';

interface Props {
  shelter: Shelter | ShelterWithDistance;
  onPress: () => void;
}

function getStatusStyle(status: Shelter['status'], theme: ReturnType<typeof useTheme>) {
  switch (status) {
    case 'open':
      return { color: theme.colors.statusOpen, label: 'Open' };
    case 'limited':
      return { color: theme.colors.statusLimited, label: 'Limited Space' };
    case 'closed':
      return { color: theme.colors.statusClosed, label: 'Closed' };
  }
}

export function ShelterCard({ shelter, onPress }: Props) {
  const theme = useTheme();
  const statusInfo = getStatusStyle(shelter.status, theme);
  const distance = 'distance' in shelter ? shelter.distance : null;

  return (
    <Card
      mode="contained"
      style={[
        styles.card,
        { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.border },
      ]}
      onPress={onPress}
      accessibilityLabel={`${shelter.name}, ${statusInfo.label}`}
    >
      <Card.Content>
        <View style={styles.header}>
          <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={2}>
            {shelter.name}
          </Text>
          {distance != null && (
            <Text
              style={[
                styles.distance,
                {
                  color: theme.colors.primary,
                  backgroundColor: theme.colors.surfaceElevated,
                },
              ]}
            >
              {formatDistance(distance)}
            </Text>
          )}
        </View>

        <Text
          style={[styles.address, { color: theme.colors.textSecondary }]}
          numberOfLines={1}
        >
          {shelter.address.street}, {shelter.address.city}, {shelter.address.state}
        </Text>

        <View style={styles.tags}>
          {shelter.type.map((t) => (
            <ServiceTag key={t} type={t} />
          ))}
        </View>

        <View style={[styles.footer, { borderTopColor: theme.colors.borderLight }]}>
          <Text style={[styles.status, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
          {shelter.capacity.totalBeds > 0 && (
            <Text style={[styles.beds, { color: theme.colors.primary }]}>
              {shelter.capacity.totalBeds} beds
            </Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21,
  },
  distance: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  address: {
    fontSize: 13,
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
    borderTopColor: 'transparent',
  },
  status: {
    fontSize: 13,
    fontWeight: '500',
  },
  beds: {
    fontSize: 13,
    fontWeight: '700',
  },
});
