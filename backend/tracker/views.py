from rest_framework import generics
from .models import Transaction
from .serializers import TransactionSerializer

# GET all transactions & POST a new transaction
class TransactionListCreateView(generics.ListCreateAPIView):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

# GET single transaction & DELETE a transaction
class TransactionDetailView(generics.RetrieveDestroyAPIView):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer