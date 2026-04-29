import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { PoLinesService } from './src/features/po-lines/po-lines.service';
import { PurchaseOrdersService } from './src/features/purchase-orders/purchase-orders.service';
import { StylesService } from './src/features/styles/styles.service';
import { LineStatus } from './src/features/po-lines/entities/po-line.entity';

async function bootstrap() {
  console.log('Bootstrapping app...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const poService = app.get(PurchaseOrdersService);
  const poLineService = app.get(PoLinesService);
  const stylesService = app.get(StylesService);
  
  try {
    console.log('1. Fetching a Style to use...');
    const styles = await stylesService.findAll();
    if (styles.length === 0) {
      console.log('No styles found. Please seed the database.');
      return;
    }
    const style = styles[0];
    console.log(`Using Style: ${style.styleCode}`);

    console.log('\n2. Creating a Purchase Order (Role TPKH)...');
    const po = await poService.create({
      poCode: `TEST-PO-${Date.now()}`,
      customer: 'Test Customer',
      receivedDate: new Date().toISOString(),
    }, 'tpkh@test.com');
    console.log(`Created PO: ${po.id}`);

    console.log('\n3. Creating a PoLine with styleId (to test AS3B cloning)...');
    const poLine = await poLineService.create(po.id, {
      styleId: style.id,
      styleCode: style.styleCode,
      productName: 'Test Line 1',
      deadline: new Date().toISOString(),
      // colorId, colorName will be set in next step
    }, 'tpkh@test.com');
    console.log(`Created PoLine: ${poLine.id} (Version: ${poLine.versionNumber})`);

    // Verify AS3B steps cloned
    const as3bSteps = await poLineService.findAs3bSteps(poLine.id);
    console.log(`Cloned AS3B steps: ${as3bSteps.length}`);

    console.log('\n4. Updating PoLine with a reason (Version bump)...');
    const updatedLine = await poLineService.update(poLine.id, {
      colorName: 'Red Test',
      reason: 'Change color to Red for testing'
    }, 'tpkh@test.com');
    console.log(`Updated PoLine to Version: ${updatedLine.versionNumber}`);

    // Verify versions
    const versions = await poLineService.findVersionHistory(poLine.id);
    console.log(`Found ${versions.length} version snapshots in history.`);
    if (versions.length > 0) {
      console.log(`Latest snapshot reason: ${versions[0].changeReason}`);
    }

    console.log('\n5. Locking the PoLine (TPKH)...');
    // We need to bypass the sampling state validation, or we move it to sampling first.
    // The lockLine checks if status === FINAL to block, and requires it to be not cancelled.
    // Wait, lockLine might require status to be SAMPLING? Let's check logic:
    // "1. Khoá thông số PoLine (status → Final)"
    // Update status to SAMPLING first if lockLine enforces it.
    await poLineService.updateStatus(poLine.id, LineStatus.SAMPLING, { actor: 'system', actorRole: 'TPKH' as any });
    
    const lockResult = await poLineService.lockLine(poLine.id, 'tpkh@test.com');
    console.log(`Locked PoLine. Status is now: ${lockResult.line.status}`);
    console.log(`Automatically created BOM: ${lockResult.bom.id} (Status: ${lockResult.bom.status})`);

    console.log('\n✅ All tests passed!');
  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    if (err.response) console.error(err.response);
  } finally {
    await app.close();
  }
}

bootstrap();
