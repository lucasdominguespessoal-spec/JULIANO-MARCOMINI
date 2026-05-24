import { PlatformCodebase } from '../types';

export const reactNativeCodebase: PlatformCodebase = {
  platform: 'React Native',
  description: 'Estruturação baseada em React Native (Expo), TypeScript, React Native Reanimated para animações orgânicas de física, e Tailwind (NativeWind) ou StyleSheet de alto contraste.',
  files: [
    {
      name: 'OnboardingScreen.tsx',
      path: 'src/screens/OnboardingScreen.tsx',
      language: 'typescript',
      content: `import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Dimensions, TextInput } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [athleteCode, setAthleteCode] = useState('');
  const [pulseScale] = useState(() => useSharedValue(1));
  const [biometricScanning, setBiometricScanning] = useState(false);

  React.useEffect(() => {
    // Morph/Pulsar constante da forma orgânica 3D
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1800 }),
        withTiming(0.95, { duration: 2200 }),
        withTiming(1.0, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const triggerBiometrics = () => {
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      // Fluxo de autorização bem-sucedido
    }, 1800);
  };

  const animated3DShapeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: pulseScale.value },
        { rotate: \`\${pulseScale.value * 12}deg\` }
      ],
      borderRadius: interpolate(
        pulseScale.value,
        [0.95, 1.1],
        [120, 80],
        Extrapolate.CLAMP
      ),
    };
  });

  return (
    <View style={styles.container}>
      {/* Cabeçalho Minimalista */}
      <View style={styles.header}>
        <Text style={styles.logo}>SIDE B</Text>
        <Text style={styles.subtitle}>CORRIDA DE CONTRASTE EXTREMO</Text>
      </View>

      {/* Forma Orgânica Central - Acionador Biométrico */}
      <View style={styles.centerSection}>
        <Pressable onPress={triggerBiometrics} style={styles.touchableArea}>
          <Animated.View style={[styles.organic3DShape, animated3DShapeStyle]}>
            {/* Gradiente Interno regulado */}
            <View style={styles.innerCore} />
            <Text style={styles.biometricLabel}>
              {biometricScanning ? 'ESCANEANDO...' : 'TOQUE E SEGURE'}
            </Text>
          </Animated.View>
        </Pressable>
      </View>

      {/* Inputs Ultra Minimalistas - Apenas linhas horizontais */}
      <View style={styles.footerInputs}>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="CÓDIGO DO ATLETA"
            placeholderTextColor="#444444"
            maxLength={12}
            value={athleteCode}
            onChangeText={setAthleteCode}
            style={styles.lineInput}
          />
          <View style={[styles.horizontalLightLine, athleteCode.length > 0 && styles.lineActive]} />
        </View>
        <Text style={styles.infoText}>ACESSO AUTORIZADO EXCLUSIVAMENTE POR BIOMETRIA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Preto absoluto OLED
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 10,
    color: '#888888',
    marginTop: 8,
    letterSpacing: 4,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  touchableArea: {
    width: 255,
    height: 255,
    alignItems: 'center',
    justifyContent: 'center',
  },
  organic3DShape: {
    width: 210,
    height: 210,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  innerCore: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 180,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  biometricLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 2,
    zIndex: 10,
  },
  footerInputs: {
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 24,
    position: 'relative',
  },
  lineInput: {
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 8,
    textAlign: 'center',
    letterSpacing: 3,
  },
  horizontalLightLine: {
    height: 1,
    backgroundColor: '#222222',
    width: '100%',
  },
  lineActive: {
    backgroundColor: '#FFFFFF',
  },
  infoText: {
    textAlign: 'center',
    color: '#444444',
    fontSize: 9,
    letterSpacing: 1,
  },
});`
    }
  ]
};

export const flutterCodebase: PlatformCodebase = {
  platform: 'Flutter',
  description: 'Estruturação baseada em Flutter com Dart. Utiliza CustomPainter para renderizar formas orgânicas mórficas 3D em tempo real em contraste extremo.',
  files: [
    {
      name: 'onboarding_screen.dart',
      path: 'lib/screens/onboarding_screen.dart',
      language: 'dart',
      content: `import 'package:flutter/material.dart';
import 'dart:math' as math;

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({Key? key}) : super(key: key);

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> with SingleTickerProviderStateMixin {
  late AnimationController _morphController;
  bool _isBiometricScanning = false;

  @override
  void initState() {
    super.initState();
    _morphController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 8),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _morphController.dispose();
    super.dispose();
  }

  void _triggerBiometricAccess() {
    setState(() {
      _isBiometricScanning = true;
    });
    Future.delayed(const Duration(milliseconds: 1800), () {
      if (mounted) {
        setState(() {
          _isBiometricScanning = false;
        });
        // Transição realizada biometria OK
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000), // OLED Absolute black
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Cabeçalho minimalista de alta densidade visual
              Column(
                children: const [
                  Text(
                    'SIDE B',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      letterSpacing: 12,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  SizedBox(height: 10),
                  Text(
                    'MONITORAMENTO EXPERIMENTAL',
                    style: TextStyle(
                      color: Color(0xFF888888),
                      fontSize: 10,
                      letterSpacing: 4,
                    ),
                  ),
                ],
              ),

              // Forma Orgânica Mórfica 3D Central
              GestureDetector(
                onLongPress: _triggerBiometricAccess,
                child: AnimatedBuilder(
                  animation: _morphController,
                  builder: (context, child) {
                    return CustomPaint(
                      painter: OrganicShapePainter(
                        animationValue: _morphController.value,
                        isScanning: _isBiometricScanning,
                      ),
                      child: Container(
                        width: 240,
                        height: 240,
                        alignment: Alignment.center,
                        child: Text(
                          _isBiometricScanning ? 'ESCANEANDO...' : 'TOQUE E SEGURE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            letterSpacing: 3,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),

              // Campo de entrada linear (Linhas de luz sem bordas clássicas)
              Column(
                children: [
                  Container(
                    width: double.infinity,
                    maxHeight: 50,
                    alignment: Alignment.center,
                    child: TextField(
                      textAlign: TextAlign.center,
                      cursorColor: Colors.white,
                      style: const TextStyle(
                        color: Colors.white,
                        letterSpacing: 4,
                      ),
                      decoration: InputDecoration(
                        hintText: "DIGITE SEU CÓDIGO",
                        hintStyle: const TextStyle(color: Color(0xFF333333)),
                        enabledBorder: const UnderlineInputBorder(
                          borderSide: BorderSide(color: Color(0xFF222222)),
                        ),
                        focusedBorder: UnderlineInputBorder(
                          borderSide: BorderSide(
                            color: Colors.white,
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    "AUTORIZAÇÃO BIOMÉTRICA MANDATÓRIA",
                    style: TextStyle(
                      color: Color(0xFF444444),
                      fontSize: 8,
                      letterSpacing: 1.5,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class OrganicShapePainter extends CustomPainter {
  final double animationValue;
  final bool isScanning;

  OrganicShapePainter({required this.animationValue, required this.isScanning});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final paint = Paint()
      ..color = isScanning ? Colors.white : const Color(0xFF111111)
      ..style = PaintingStyle.stroke
      ..strokeWidth = isScanning ? 2.5 : 1.0;

    final path = Path();
    final double radius = size.width / 3;
    final int pointsCount = 120;

    for (int i = 0; i <= pointsCount; i++) {
      final double angle = (i * 2 * math.pi) / pointsCount;
      final double offset = math.sin(angle * 4 + animationValue * 2 * math.pi) * (isScanning ? 18.0 : 8.0) * math.cos(angle * 2);
      final double currentRadius = radius + offset;
      final double x = center.dx + currentRadius * math.cos(angle);
      final double y = center.dy + currentRadius * math.sin(angle);

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();

    if (isScanning) {
      canvas.drawPath(path, Paint()
        ..color = Colors.white12
        ..style = PaintingStyle.fill
      );
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant OrganicShapePainter oldDelegate) {
    return oldDelegate.animationValue != animationValue || oldDelegate.isScanning != isScanning;
  }
}
`
    }
  ]
};
