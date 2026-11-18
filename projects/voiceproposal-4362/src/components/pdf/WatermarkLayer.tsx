import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

interface WatermarkLayerProps {
  proposalId: string;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diagonalBlock: {
    transform: 'rotate(-32deg)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#6D28D9',
    borderRadius: 8,
    backgroundColor: '#090D16',
    opacity: 0.14,
  },
  primaryText: {
    fontSize: 34,
    fontFamily: 'Helvetica-Bold',
    color: '#6D28D9',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subText: {
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: '#94A3B8',
    marginTop: 6,
    letterSpacing: 1.5,
  },
  bottomBanner: {
    position: 'absolute',
    bottom: 12,
    left: 20,
    right: 20,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#64748B',
  },
  brandLink: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6D28D9',
  },
});

export const WatermarkLayer: React.FC<WatermarkLayerProps> = ({ proposalId }) => {
  return (
    <View style={styles.container} fixed>
      {/* Central High-Visibility Watermark */}
      <View style={styles.diagonalBlock}>
        <Text style={styles.primaryText}>VOICEPROPOSAL FREE</Text>
        <Text style={styles.subText}>UNVERIFIED DRAFT - UPGRADE TO REMOVE WATERMARK</Text>
        <Text style={styles.subText}>REF ID: {proposalId.slice(0, 8)}</Text>
      </View>

      {/* Mandatory Free Tier Footer */}
      <View style={styles.bottomBanner}>
        <Text style={styles.badgeText}>Generated autonomously by VoiceProposal Studio Engine (B2.st)</Text>
        <Text style={styles.brandLink}>voiceproposal.b2.st</Text>
      </View>
    </View>
  );
};