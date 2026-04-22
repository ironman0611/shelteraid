import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Layout } from '../constants/layout';
import { useTheme } from '../theme/useTheme';

export function AboutDeveloperScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      accessibilityLabel="About Shelter Aid and the developer"
    >
      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.colors.primarySoft,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.heroTitle, { color: theme.colors.primary }]}>Shelter Aid</Text>
        <Text style={[styles.heroTagline, { color: theme.colors.textSecondary }]}>
          Clear information when it matters most
        </Text>
      </View>

      <Section title="About this app" theme={theme}>
        <Paragraph theme={theme}>
          Shelter Aid helps people find emergency shelter, transitional housing, food, and medical
          resources in one place. Search and map views make it easier to locate services nearby, save
          favorites locally on your device, and reach out with directions or a phone call when you
          need help fast. The goal is simple: reduce friction for anyone looking for a safe place or
          support.
        </Paragraph>
      </Section>

      <Section title="About the developer" theme={theme}>
        <Text style={[styles.devName, { color: theme.colors.text }]}>Abhimanyu Kaushik</Text>
        <Paragraph theme={theme}>
          Abhimanyu is a student with a deep interest in computer science and in using technology as
          a tool for real-world impact. He is drawn to problems that affect everyday people—especially
          those who are underserved—and enjoys turning complex, messy challenges into clear,
          approachable solutions.
        </Paragraph>
        <Paragraph theme={theme}>
          Shelter Aid grew out of that mindset: a purposeful project focused on dignity, access, and
          practical help. By combining maps, search, and thoughtful design, he aims to make critical
          resource information easier to discover when stress is high and time is short.
        </Paragraph>
        <Paragraph theme={theme}>
          Whether through coursework, side projects, or civic-minded apps like this one, Abhimanyu
          continues to build skills in software development while keeping people—not just code—at the
          center of the work. Shelter Aid reflects both his technical curiosity and his commitment to
          building technology that serves communities in need.
        </Paragraph>
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  theme,
  children,
}: {
  title: string;
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>{title}</Text>
      {children}
    </View>
  );
}

function Paragraph({
  theme,
  children,
}: {
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}) {
  return <Text style={[styles.paragraph, { color: theme.colors.text }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: Layout.screenPadding,
    paddingBottom: 40,
  },
  hero: {
    borderRadius: Layout.borderRadius + 6,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroTagline: {
    fontSize: Layout.fontSizeBody,
    marginTop: 6,
    lineHeight: 22,
    fontWeight: '500',
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: Layout.fontSizeXSmall,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  devName: {
    fontSize: Layout.fontSizeH2,
    fontWeight: '700',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: Layout.fontSizeBody,
    lineHeight: 24,
    marginBottom: 14,
  },
});
