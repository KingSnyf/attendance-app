import { Controller, Post, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Public } from '../auth/public.decorator';
import { StrictRateLimiterGuard } from '../auth/strict-rate-limiter.guard';

@Controller('mobile')
export class MobileController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Post('verify-zone')
  async verifyZone(@Body() body: { bssid?: string; ssid?: string; ipLocale?: string }) {
    const settings = await this.prisma.setting.findFirst();
    if (!settings) throw new BadRequestException('Settings not configured');

    // Mode test : contourne la vérification réseau (émulateur, démo)
    if (process.env.BYPASS_ZONE_CHECK === 'true') {
      return { valide: true, erreurs: [], modeTest: true };
    }

    const errors: string[] = [];
    const bssid = (body.bssid || '').toLowerCase();
    const ssid = (body.ssid || '').trim();

    // Vérification réseau : le BSSID OU le SSID doivent correspondre.
    // Le SSID est privilégié car le BSSID peut être randomisé par Android.
    const bssidOk = !!settings.reseauBssid &&
      settings.reseauBssid !== '00:00:00:00:00:00' &&
      bssid === settings.reseauBssid.toLowerCase();
    const ssidOk = !!settings.reseauSsid && settings.reseauSsid.trim() !== '' &&
      ssid.toLowerCase() === settings.reseauSsid.toLowerCase();

    if (settings.reseauBssid && settings.reseauBssid !== '00:00:00:00:00:00' && !bssidOk && !ssidOk) {
      errors.push(
        `Réseau non reconnu (BSSID=${body.bssid || 'inconnu'}, SSID=${body.ssid || 'inconnu'}, attendu BSSID=${settings.reseauBssid}${settings.reseauSsid ? ' ou SSID=' + settings.reseauSsid : ''})`
      );
    }

    // Vérification plage IP (gardefou optionnel)
    if (settings.plageIpLocale && body.ipLocale) {
      const ipParts = body.ipLocale.split('.').map(Number);
      if (ipParts.length === 4) {
        const ipInt = (ipParts[0] << 24) + (ipParts[1] << 16) + (ipParts[2] << 8) + ipParts[3];
        const [range, bits] = settings.plageIpLocale.split('/');
        const rangeParts = range.split('.').map(Number);
        const rangeInt = (rangeParts[0] << 24) + (rangeParts[1] << 16) + (rangeParts[2] << 8) + rangeParts[3];
        const mask = ~(2 ** (32 - parseInt(bits)) - 1);
        if ((ipInt & mask) !== (rangeInt & mask)) {
          errors.push(`IP hors plage autorisée: ${body.ipLocale} (attendu: ${settings.plageIpLocale})`);
        }
      }
    }

    return { valide: errors.length === 0, erreurs: errors };
  }

  @Public()
  @UseGuards(StrictRateLimiterGuard)
  @Post('verify-pin')
  async verifyPin(@Body() body: { email: string; codePin: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.actif || !user.codePinHash) throw new BadRequestException('Identifiants incorrects');

    const bcrypt = await import('bcryptjs');
    const pinOk = await bcrypt.compare(body.codePin, user.codePinHash);
    if (!pinOk) {
      const nouvellesTentatives = (user.tentativesPin ?? 0) + 1;
      const updateData: any = { tentativesPin: nouvellesTentatives };
      if (nouvellesTentatives >= 5) {
        updateData.blocagePinJusqua = new Date(Date.now() + 30 * 60 * 1000);
        updateData.tentativesPin = 0;
      }
      await this.prisma.user.update({ where: { id: user.id }, data: updateData });
      throw new BadRequestException('Code PIN incorrect');
    }

    if ((user.tentativesPin ?? 0) > 0 || user.blocagePinJusqua) {
      await this.prisma.user.update({ where: { id: user.id }, data: { tentativesPin: 0, blocagePinJusqua: null } });
    }

    return { valide: true, userId: user.id, nom: user.lastName || '', prenom: user.firstName || '' };
  }
}
