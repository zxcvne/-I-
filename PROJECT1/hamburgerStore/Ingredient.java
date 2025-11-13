package hamburgerStore;

public class Ingredient {
   private String name;      // 재료명
   private int stock;         // 재고
   private int cost;         // 구매 원가
   private int sale;         // 판매가 
   private int count;         // 당일 구매 갯수
   private int saleCount;      // 당일 판매 갯수
   private int kind;         // 1.재료, 2.음료수

   public Ingredient(String name, int stock, int cost, int sale, int count, int saleCount, int kind) {
      this.name = name;
      this.stock = stock;
      this.cost = cost;
      this.sale = sale;
      this.count = count;
      this.saleCount = saleCount;
      this.kind = kind;
   }
   
   // 판매 금액
   public int costTot(int saleCount) {
      return sale * saleCount;
   }

   public String getName() {
      return name;
   }

   public void setName(String name) {
      this.name = name;
   }

   public int getStock() {
      return stock;
   }

   public void setStock(int stock) {
      this.stock = stock;
   }

   public int getCost() {
      return cost;
   }

   public void setCost(int cost) {
      this.cost = cost;
   }

   public int getSale() {
      return sale;
   }

   public void setSale(int sale) {
      this.sale = sale;
   }

   public int getCount() {
      return count;
   }

   public void setCount(int count) {
      this.count = count;
   }

   public int getSaleCount() {
      return saleCount;
   }

   public void setSaleCount(int saleCount) {
      this.saleCount = saleCount;
   }

   public int getKind() {
      return kind;
   }

   public void setKind(int kind) {
      this.kind = kind;
   }

   @Override
   public String toString() {
      return name + ": 재고 = " + stock + ": 구매원가 = " + cost + ", 판매가 = " + sale + ", 구매수량 = " + count + ", 판매수량="
            + saleCount + ", 종류=" + kind;
   }
   
}
