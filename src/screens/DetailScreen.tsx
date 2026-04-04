import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { RouteProp, useRoute } from '@react-navigation/native';
import { ServiceTag } from '../components/ServiceTag';
import { ActionButton } from '../components/ActionButton';
import { loadShelters } from '../data/shelterService';
import { openDialer, openDirections, openWebsite } from '../utils/linking';
import { Colors } from '../constants/colors';
import { Layout } from '../constants/layout';

type DetailParamList = {
  Detail: { shelterId: string };
};

function getStatusInfo(status: 'open' | 'limited' | 'closed') {
  switch (status) {
    case 'open':
      return { color: Colors.statusOpen, label: 'Open Now' };
    case 'limited':
      return { color: Colors.statusLimited, label: 'Limited Space' };
    case 'closed':
      return { color: Colors.statusClosed, label: 'Closed' };
  }
}

export function DetailScreen() {
  const route = useRoute<RouteProp<DetailParamList, 'Detail'>>();
  const shelter = loadShelters().find((s) => s.id === route.params.shelterId);

  if (!shelter) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Shelter not found.</Text>
      </View>
    );
  }

  const statusInfo = getStatusInfo(shelter.status);
  const fullAddress = `${shelter.address.street}, ${shelter.address.city}, ${shelter.address.state} ${shelter.address.zip}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={styles.name}>{shelter.name}</Text>
      <Text style={styles.org}>{shelter.organizationName}</Text>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.label}
        </Text>
      </View>

      {/* Mini Map */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.miniMap}
          initialRegion={{
            latitude: shelter.coordinates.latitude,
            longitude: shelter.coordinates.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          <Marker coordinate={shelter.coordinates} />
        </MapView>
      </View>

      {/* Address */}
      <Section title="Address">
        <Text style={styles.bodyText}>{fullAddress}</Text>
      </Section>

      {/* Hours & Eligibility */}
      <Section title="Hours">
        <Text style={styles.bodyText}>{shelter.hours}</Text>
      </Section>

      <Section title="Eligibility">
        <Text style={styles.bodyText}>{shelter.eligibility}</Text>
      </Section>

      {/* Capacity */}
      {shelter.capacity.totalBeds > 0 && (
        <Section title="Capacity">
          <DetailRow label="Total Beds" value={String(shelter.capacity.totalBeds)} />
          <DetailRow label="Year-Round" value={String(shelter.capacity.yearRoundBeds)} />
          {shelter.capacity.seasonalBeds > 0 && (
            <DetailRow label="Seasonal" value={String(shelter.capacity.seasonalBeds)} />
          )}
        </Section>
      )}

      {/* Type Tags */}
      <Section title="Type">
        <View style={styles.tagRow}>
          {shelter.type.map((t) => (
            <ServiceTag key={t} type={t} />
          ))}
        </View>
      </Section>

      {/* Services */}
      {shelter.services.length > 0 && (
        <Section title="Services">
          <View style={styles.servicesList}>
            {shelter.services.map((s) => (
              <View key={s} style={styles.serviceBadge}>
                <Text style={styles.serviceBadgeText}>{s}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {shelter.phone && (
          <ActionButton
            label="Call"
            variant="primary"
            onPress={() => openDialer(shelter.phone!)}
            accessibilityLabel={`Call ${shelter.name}`}
          />
        )}
        <ActionButton
          label="Directions"
          variant="secondary"
          onPress={() =>
            openDirections(
              shelter.coordinates.latitude,
              shelter.coordinates.longitude,
              shelter.name,
            )
          }
          accessibilityLabel={`Get directions to ${shelter.name}`}
        />
      </View>

      {/* Website */}
      {shelter.website && (
        <ActionButton
          label="Visit Website"
          variant="secondary"
          onPress={() => openWebsite(shelter.website!)}
        />
      )}

      <Text style={styles.lastUpdated}>
        Last updated: {shelter.lastUpdated}
      </Text>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  content: {
    padding: Layout.screenPadding,
    paddingBottom: 40,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
    color: Colors.textSecondary,
    fontSize: Layout.fontSizeBody,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 28,
  },
  org: {
    fontSize: Layout.fontSizeSmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: Layout.fontSizeSmall,
    fontWeight: '600',
  },
  mapContainer: {
    marginTop: 16,
    borderRadius: Layout.borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniMap: {
    height: 150,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: Layout.fontSizeXSmall,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: Layout.fontSizeBody,
    color: Colors.text,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: Layout.fontSizeBody,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: Layout.fontSizeBody,
    color: Colors.text,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceBadge: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceBadgeText: {
    fontSize: Layout.fontSizeXSmall,
    color: Colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
  },
  lastUpdated: {
    fontSize: Layout.fontSizeXSmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
});
