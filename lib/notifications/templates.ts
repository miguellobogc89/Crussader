import { prismaRaw } from "@/lib/prisma";
import { Review } from "@prisma/client";

export async function renderReviewCreatedTemplate(review: Partial<Review>) {
  const reviewerName = review.reviewerName ?? "Alguien";
  const rating = review.rating ?? "?";
  const comment = review.comment ?? "(sin comentario)";

  let locationName = "una de tus ubicaciones";

  if (review.locationId) {
    try {
      const location = await prismaRaw.location.findUnique({
        where: { id: review.locationId },
        select: { title: true },
      });
      if (location?.title) {
        locationName = location.title;
      }
    } catch (e) {
      console.warn("[template] No se pudo obtener el nombre de la ubicación:", e);
    }
  }

  return {
    subject: `¡Tienes una nueva reseña en ${locationName}!`,
    body: `${reviewerName} ha dejado una nueva reseña de ${rating} ⭐ en ${locationName}:\n\n${comment}`,
  };
}
