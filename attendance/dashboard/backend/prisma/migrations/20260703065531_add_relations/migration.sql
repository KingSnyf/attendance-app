-- AddForeignKey
ALTER TABLE "RequestModification" ADD CONSTRAINT "RequestModification_sessionPresenceId_fkey" FOREIGN KEY ("sessionPresenceId") REFERENCES "SessionPresence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogAction" ADD CONSTRAINT "LogAction_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
