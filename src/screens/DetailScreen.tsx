import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { DetailMiniMap } from '../components/DetailMiniMap';
import { ServiceTag } from '../components/ServiceTag';
import { ActionButton } from '../components/ActionButton';
import { useMyShelters } from '../context/MySheltersContext';
import { loadShelters } from '../data/shelterService';
import { openDialer, openDirections, openWebsite } from '../utils/linking';
import { Layout } from '../constants/layout';
import { useTheme } from '../theme/useTheme';

type DetailParamList = {
  Detail: { shelterId: string };
};

function getStatusInfo(
  status: 'open' | 'limited' | 'closed',
  theme: ReturnType<typeof useTheme>,
) {
  switch (status) {
    case 'open':
      return { color: theme.colors.statusOpen, label: 'Open Now' };
    case 'limited':
      return { color: theme.colors.statusLimited, label: 'Limited Space' };
    case 'closed':
      return { color: theme.colors.statusClosed, label: 'Closed' };
  }
}

export function DetailScreen() {
  const theme = useTheme();
  const route = useRoute<RouteProp<DetailParamList, 'Detail'>>();
  const { isSaved, saveShelter, removeShelter, isReady } = useMyShelters();
  const shelter = loadShelters().find((s) => s.id === route.params.shelterId);

  if (!shelter) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>Shelter not found.</Text>
      </View>
    );
  }

  const statusInfo = getStatusInfo(shelter.status, theme);
  const fullAddress = `${shelter.address.street}, ${shelter.address.city}, ${shelter.address.state} ${shelter.address.zip}`;
  const saved = isSaved(shelter.id);

  const handleMyShelterPress = async () => {
    if (saved) {
      await removeShelter(shelter.id);
      return;
    }
    const ok = await saveShelter(shelter.id);
    if (!ok) {
      Alert.alert(
        'My Shelter is full',
        'You can save up to 5 shelters. Delete one from the My Shelter tab before adding another.',
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <Text style={[styles.name, { color: theme.colors.text }]}>{shelter.name}</Text>
      <Text style={[styles.org, { color: theme.colors.textSecondary }]}>{shelter.organizationName}</Text>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.label}
        </Text>
      </View>

      {/* Mini Map */}
      <View style={[styles.mapContainer, { borderColor: theme.colors.border }]}>
        <DetailMiniMap coordinates={shelter.coordinates} />
      </View>

      {/* Address */}
      <Section title="Address">
        <Text style={[styles.bodyText, { color: theme.colors.text }]}>{fullAddress}</Text>
      </Section>

      {/* Hours & Eligibility */}
      <Section title="Hours">
        <Text style={[styles.bodyText, { color: theme.colors.text }]}>{shelter.hours}</Text>
      </Section>

      <Section title="Eligibility">
        <Text style={[styles.bodyText, { color: theme.colors.text }]}>{shelter.eligibility}</Text>
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
              <View
                key={s}
                style={[
                  styles.serviceBadge,
                  {
                    backgroundColor: theme.colors.primarySoft,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text style={[styles.serviceBadgeText, { color: theme.colors.primary }]}>{s}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* My Shelter (local only) */}
      <View style={styles.myShelterRow}>
        {!isReady ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : (
          <ActionButton
            label={saved ? 'Remove from My Shelter' : 'Save to My Shelter'}
            variant="secondary"
            onPress={() => void handleMyShelterPress()}
            accessibilityLabel={
              saved ? `Remove ${shelter.name} from My Shelter` : `Save ${shelter.name} to My Shelter`
            }
          />
        )}
      </View>

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

      <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>
        Last updated: {shelter.lastUpdated}
      </Text>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: theme.colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Layout.screenPadding,
    paddingBottom: 40,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: Layout.fontSizeBody,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
  },
  org: {
    fontSize: Layout.fontSizeSmall,
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
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: Layout.fontSizeXSmall,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: Layout.fontSizeBody,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: Layout.fontSizeBody,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: Layout.fontSizeBody,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  serviceBadgeText: {
    fontSize: Layout.fontSizeXSmall,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  myShelterRow: {
    marginTop: 20,
    minHeight: 48,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  lastUpdated: {
    fontSize: Layout.fontSizeXSmall,
    textAlign: 'center',
    marginTop: 24,
  },
});
